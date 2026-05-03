module escrow::escrow {
    use std::signer;
    use std::string::{Self, String};
    use std::vector;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::event;
    use aptos_framework::account;

    // ── Error codes ──────────────────────────────────
    const E_NOT_ORACLE: u64 = 1;
    const E_NOT_CLIENT: u64 = 2;
    const E_INVALID_STATUS: u64 = 3;
    const E_ALREADY_INITIALIZED: u64 = 4;

    // ── Status enum (stored as u8) ────────────────────
    const STATUS_PENDING: u8    = 0;
    const STATUS_SUBMITTED: u8  = 1;
    const STATUS_PASSED: u8     = 2;
    const STATUS_FAILED: u8     = 3;
    const STATUS_COMPLETED: u8  = 4;
    const STATUS_REFUNDED: u8   = 5;

    // ── Events ───────────────────────────────────────
    struct SolutionSubmitted has drop, store {
        milestone_id: u64,
        code_hash: String,
    }
    struct PaymentReleased has drop, store {
        milestone_id: u64,
        freelancer: address,
        amount: u64,
    }

    // ── Core data structures ─────────────────────────
    struct Milestone has store {
        id: u64,
        client: address,
        freelancer: address,
        reward: Coin<AptosCoin>,
        description: String,
        test_hash: String,
        code_hash: String,
        status: u8,
    }

    struct EscrowStore has key {
        milestones: vector<Milestone>,
        next_id: u64,
        oracle_address: address,
        solution_events: event::EventHandle<SolutionSubmitted>,
        payment_events: event::EventHandle<PaymentReleased>,
    }

    // ── Initialize (call once as oracle account) ─────
    public entry fun initialize(oracle: &signer) {
        let addr = signer::address_of(oracle);
        assert!(!exists<EscrowStore>(addr), E_ALREADY_INITIALIZED);
        move_to(oracle, EscrowStore {
            milestones: vector::empty(),
            next_id: 0,
            oracle_address: addr,
            solution_events: account::new_event_handle<SolutionSubmitted>(oracle),
            payment_events: account::new_event_handle<PaymentReleased>(oracle),
        });
    }

    // ── Client creates a milestone and locks APT ─────
    public entry fun create_milestone(
        client: &signer,
        oracle_addr: address,
        freelancer: address,
        reward_amount: u64,
        description: vector<u8>,
        test_hash: vector<u8>,
    ) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore>(oracle_addr);
        let id = store.next_id;
        store.next_id = id + 1;
        let coins = coin::withdraw<AptosCoin>(client, reward_amount);
        let ms = Milestone {
            id,
            client: signer::address_of(client),
            freelancer,
            reward: coins,
            description: string::utf8(description),
            test_hash: string::utf8(test_hash),
            code_hash: string::utf8(b""),
            status: STATUS_PENDING,
        };
        vector::push_back(&mut store.milestones, ms);
    }

    // ── Freelancer submits solution CID ───────────────
    public entry fun submit_solution(
        _freelancer: &signer,
        oracle_addr: address,
        milestone_id: u64,
        code_hash: vector<u8>,
    ) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore>(oracle_addr);
        let ms = vector::borrow_mut(&mut store.milestones, milestone_id);
        assert!(ms.status == STATUS_PENDING, E_INVALID_STATUS);
        ms.code_hash = string::utf8(code_hash);
        ms.status = STATUS_SUBMITTED;
        event::emit_event(&mut store.solution_events, SolutionSubmitted {
            milestone_id,
            code_hash: string::utf8(code_hash),
        });
    }

    // ── Oracle reports result ─────────────────────────
    public entry fun report_result(
        oracle: &signer,
        milestone_id: u64,
        passed: bool,
    ) acquires EscrowStore {
        let oracle_addr = signer::address_of(oracle);
        let store = borrow_global_mut<EscrowStore>(oracle_addr);
        assert!(oracle_addr == store.oracle_address, E_NOT_ORACLE);
        let ms = vector::borrow_mut(&mut store.milestones, milestone_id);
        assert!(ms.status == STATUS_SUBMITTED, E_INVALID_STATUS);
        if (passed) {
            ms.status = STATUS_PASSED;
            let amount = coin::value(&ms.reward);
            let payment = coin::extract(&mut ms.reward, amount);
            coin::deposit(ms.freelancer, payment);
            ms.status = STATUS_COMPLETED;
            event::emit_event(&mut store.payment_events, PaymentReleased {
                milestone_id,
                freelancer: ms.freelancer,
                amount,
            });
        } else {
            ms.status = STATUS_FAILED;
        }
    }

    // ── Client refunds if freelancer never submits ────
    public entry fun refund(
        client: &signer,
        oracle_addr: address,
        milestone_id: u64,
    ) acquires EscrowStore {
        let store = borrow_global_mut<EscrowStore>(oracle_addr);
        let ms = vector::borrow_mut(&mut store.milestones, milestone_id);
        assert!(signer::address_of(client) == ms.client, E_NOT_CLIENT);
        assert!(ms.status == STATUS_PENDING || ms.status == STATUS_FAILED, E_INVALID_STATUS);
        let amount = coin::value(&ms.reward);
        let refund_coins = coin::extract(&mut ms.reward, amount);
        coin::deposit(ms.client, refund_coins);
        ms.status = STATUS_REFUNDED;
    }

    // ── View function: get milestone status ───────────
    #[view]
    public fun get_status(oracle_addr: address, milestone_id: u64): u8 acquires EscrowStore {
        let store = borrow_global<EscrowStore>(oracle_addr);
        vector::borrow(&store.milestones, milestone_id).status
    }

        // ── UNIT TESTS ────────────────────────────────────
 
    #[test_only]
    use aptos_framework::aptos_coin;

    #[test(oracle = @0x1, client = @0x2, freelancer = @0x3, aptos_framework = @aptos_framework)]
    public entry fun test_create_milestone(
        oracle: signer, client: signer, freelancer: signer, aptos_framework: signer
    ) acquires EscrowStore {
        // Setup
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
        account::create_account_for_test(signer::address_of(&oracle));
        account::create_account_for_test(signer::address_of(&client));
        account::create_account_for_test(signer::address_of(&freelancer));
        coin::register<AptosCoin>(&client);
        let coins = coin::mint<AptosCoin>(1000000, &mint_cap);
        coin::deposit(signer::address_of(&client), coins);
        // Initialize escrow
        initialize(&oracle);
        // Create milestone
        create_milestone(&client, signer::address_of(&oracle), signer::address_of(&freelancer),
            500000, b"Test task", b"QmTestCID");
        // Verify
        let store = borrow_global<EscrowStore>(signer::address_of(&oracle));
        assert!(vector::length(&store.milestones) == 1, 1);
        let ms = vector::borrow(&store.milestones, 0);
        assert!(ms.status == STATUS_PENDING, 2);
        assert!(coin::value(&ms.reward) == 500000, 3);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(oracle = @0x1, client = @0x2, freelancer = @0x3, aptos_framework = @aptos_framework)]
    public entry fun test_report_result_pass(
        oracle: signer, client: signer, freelancer: signer, aptos_framework: signer
    ) acquires EscrowStore {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
        account::create_account_for_test(signer::address_of(&oracle));
        account::create_account_for_test(signer::address_of(&client));
        account::create_account_for_test(signer::address_of(&freelancer));
        coin::register<AptosCoin>(&client);
        coin::register<AptosCoin>(&freelancer);
        let coins = coin::mint<AptosCoin>(1000000, &mint_cap);
        coin::deposit(signer::address_of(&client), coins);
        initialize(&oracle);
        create_milestone(&client, signer::address_of(&oracle), signer::address_of(&freelancer),
            500000, b"Test", b"QmTest");
        submit_solution(&freelancer, signer::address_of(&oracle), 0, b"QmCode");
        report_result(&oracle, 0, true);
        // Verify freelancer received APT
        assert!(coin::balance<AptosCoin>(signer::address_of(&freelancer)) == 500000, 1);
        let store = borrow_global<EscrowStore>(signer::address_of(&oracle));
        let ms = vector::borrow(&store.milestones, 0);
        assert!(ms.status == STATUS_COMPLETED, 2);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }

    #[test(oracle = @0x1, client = @0x2, freelancer = @0x3, aptos_framework = @aptos_framework)]
    public entry fun test_report_result_fail(
        oracle: signer, client: signer, freelancer: signer, aptos_framework: signer
    ) acquires EscrowStore {
        let (burn_cap, mint_cap) = aptos_coin::initialize_for_test(&aptos_framework);
        account::create_account_for_test(signer::address_of(&oracle));
        account::create_account_for_test(signer::address_of(&client));
        account::create_account_for_test(signer::address_of(&freelancer));
        coin::register<AptosCoin>(&client);
        coin::register<AptosCoin>(&freelancer);
        let coins = coin::mint<AptosCoin>(1000000, &mint_cap);
        coin::deposit(signer::address_of(&client), coins);
        initialize(&oracle);
        create_milestone(&client, signer::address_of(&oracle), signer::address_of(&freelancer),
            500000, b"Test", b"QmTest");
        submit_solution(&freelancer, signer::address_of(&oracle), 0, b"QmBadCode");
        report_result(&oracle, 0, false);
        // Verify freelancer did NOT receive APT
        assert!(coin::balance<AptosCoin>(signer::address_of(&freelancer)) == 0, 1);
        let store = borrow_global<EscrowStore>(signer::address_of(&oracle));
        let ms = vector::borrow(&store.milestones, 0);
        assert!(ms.status == STATUS_FAILED, 2);
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
    }



}
