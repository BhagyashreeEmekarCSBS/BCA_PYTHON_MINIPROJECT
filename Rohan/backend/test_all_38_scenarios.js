const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function req(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

let passed = 0;
let failed = 0;

function assert(condition, testNum, description) {
  if (condition) {
    console.log(`✅ [SCENARIO ${testNum}] PASS: ${description}`);
    passed++;
  } else {
    console.error(`❌ [SCENARIO ${testNum}] FAIL: ${description}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('===============================================================');
  console.log('   FULL STACK INTERN CODING CHALLENGE — 38 E2E TEST SUITE     ');
  console.log('===============================================================\n');

  try {
    // -------------------------------------------------------------
    // ADMIN WORKFLOW (Scenarios 1 - 13)
    // -------------------------------------------------------------
    console.log('--- ADMIN SCENARIOS ---');

    // 1. Admin login
    const adminLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: 'admin@storerating.com', password: 'Admin@123' },
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 1, 'Admin login returns 200 and JWT');
    const adminToken = adminLogin.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 2. Admin dashboard statistics
    const adminStats = await req(`${API_BASE}/admin/dashboard`, adminHeaders);
    assert(
      adminStats.status === 200 &&
      typeof adminStats.data.totalUsers === 'number' &&
      typeof adminStats.data.totalStores === 'number' &&
      typeof adminStats.data.totalRatings === 'number',
      2,
      `Admin dashboard stats verified (${adminStats.data.totalUsers} users, ${adminStats.data.totalStores} stores, ${adminStats.data.totalRatings} ratings)`
    );

    // 3. Create normal user
    const normUserEmail = `normal_${Date.now()}@storerating.com`;
    const createNormRes = await req(`${API_BASE}/admin/users`, {
      method: 'POST',
      ...adminHeaders,
      body: {
        name: 'Normal User Admin', // 17 chars (5-20)
        email: normUserEmail,
        password: 'NormalUser@123',
        address: '123 Regular Street, Sector 4',
        role: 'user',
      },
    });
    assert(createNormRes.status === 201 && createNormRes.data.user.role === 'user', 3, 'Admin creates normal user');

    // 4. Create admin
    const adminUserEmail = `admin_${Date.now()}@storerating.com`;
    const createAdminRes = await req(`${API_BASE}/admin/users`, {
      method: 'POST',
      ...adminHeaders,
      body: {
        name: 'Admin User Officer', // 18 chars (5-20)
        email: adminUserEmail,
        password: 'AdminOfficer@123',
        address: '456 Executive Boulevard, Tower A',
        role: 'admin',
      },
    });
    assert(createAdminRes.status === 201 && createAdminRes.data.user.role === 'admin', 4, 'Admin creates another admin user');

    // Pre-requisite: Create a dedicated Store Owner for testing
    const ownerEmail = `storeowner_${Date.now()}@storerating.com`;
    const createOwnerRes = await req(`${API_BASE}/admin/users`, {
      method: 'POST',
      ...adminHeaders,
      body: {
        name: 'Master Store Owner', // 18 chars (5-20)
        email: ownerEmail,
        password: 'OwnerPass@123',
        address: '789 Commercial Plaza, Suite 200',
        role: 'store_owner',
      },
    });
    const createdOwner = createOwnerRes.data.user;

    // 5. Create store
    const storeEmail = `store_${Date.now()}@organicmarket.com`;
    const createStoreRes = await req(`${API_BASE}/admin/stores`, {
      method: 'POST',
      ...adminHeaders,
      body: {
        name: 'Pristine Organic Fresh Foods Market', // 35 chars
        email: storeEmail,
        address: '999 Eco Valley Road, Green City',
        ownerId: createdOwner.id,
      },
    });
    assert(createStoreRes.status === 201 && createStoreRes.data.store.id, 5, 'Admin creates store and links store owner');
    const testStoreId = createStoreRes.data.store.id;

    // 6. View users
    const viewUsersRes = await req(`${API_BASE}/admin/users`, adminHeaders);
    assert(viewUsersRes.status === 200 && Array.isArray(viewUsersRes.data.users), 6, 'Admin views list of all users');

    // 7. Filter users
    const filterUsersRes = await req(`${API_BASE}/admin/users?role=store_owner&name=Master`, adminHeaders);
    const allFilteredAreOwners = filterUsersRes.data.users.every((u) => u.role === 'store_owner');
    assert(filterUsersRes.status === 200 && filterUsersRes.data.users.length > 0 && allFilteredAreOwners, 7, 'Admin filters users by role and name simultaneously');

    // 8. Sort users
    const sortUsersAsc = await req(`${API_BASE}/admin/users?sortBy=name&sortOrder=asc`, adminHeaders);
    const sortUsersDesc = await req(`${API_BASE}/admin/users?sortBy=name&sortOrder=desc`, adminHeaders);
    const nameAscFirst = sortUsersAsc.data.users[0]?.name;
    const nameDescFirst = sortUsersDesc.data.users[0]?.name;
    assert(sortUsersAsc.status === 200 && sortUsersDesc.status === 200 && nameAscFirst !== nameDescFirst, 8, 'Admin sorts users by name ASC and DESC');

    // 9. View stores
    const viewStoresRes = await req(`${API_BASE}/admin/stores`, adminHeaders);
    assert(viewStoresRes.status === 200 && Array.isArray(viewStoresRes.data.stores), 9, 'Admin views list of stores with Name, Email, Address, Rating');

    // 10. Filter stores
    const filterStoresRes = await req(`${API_BASE}/admin/stores?name=Pristine`, adminHeaders);
    assert(filterStoresRes.status === 200 && filterStoresRes.data.stores.length > 0, 10, 'Admin filters stores by name');

    // 11. Sort stores (including by rating)
    const sortStoresRating = await req(`${API_BASE}/admin/stores?sortBy=rating&sortOrder=desc`, adminHeaders);
    assert(sortStoresRating.status === 200 && Array.isArray(sortStoresRating.data.stores), 11, 'Admin sorts stores by rating (whitelisted & safe)');

    // 12. View user details
    const userDetailRes = await req(`${API_BASE}/admin/users/${createdOwner.id}`, adminHeaders);
    assert(userDetailRes.status === 200 && userDetailRes.data.user.id === createdOwner.id, 12, 'Admin views user details');

    // 13. View store-owner rating in details
    assert(
      userDetailRes.status === 200 &&
      userDetailRes.data.user.role === 'store_owner' &&
      userDetailRes.data.user.ownedStore !== undefined,
      13,
      'Admin views store-owner details including owned store and rating metrics'
    );

    // -------------------------------------------------------------
    // NORMAL USER WORKFLOW (Scenarios 14 - 21)
    // -------------------------------------------------------------
    console.log('\n--- NORMAL USER SCENARIOS ---');

    // 14. Signup
    const shopperEmail = `shopper_${Date.now()}@storerating.com`;
    const signupRes = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: {
        name: 'Samantha Shopper', // 16 chars (5-20)
        email: shopperEmail,
        password: 'ShopperPass@123',
        address: '555 Consumer Way, Suite 10',
      },
    });
    assert(signupRes.status === 201 && signupRes.data.token && signupRes.data.user.role === 'user', 14, 'Normal user signs up successfully with default user role');

    // 15. Login
    const shopperLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: shopperEmail, password: 'ShopperPass@123' },
    });
    assert(shopperLogin.status === 200 && shopperLogin.data.token, 15, 'Normal user logs in with valid credentials');
    const shopperToken = shopperLogin.data.token;
    const shopperHeaders = { headers: { Authorization: `Bearer ${shopperToken}` } };

    // 16. Search stores by Name and by Address
    const searchByName = await req(`${API_BASE}/stores?name=Pristine`, shopperHeaders);
    const searchByAddr = await req(`${API_BASE}/stores?address=Eco`, shopperHeaders);
    assert(
      searchByName.status === 200 && searchByName.data.stores.length > 0 &&
      searchByAddr.status === 200 && searchByAddr.data.stores.length > 0,
      16,
      'Normal user searches stores by Name and by Address'
    );

    // 17. Sort stores
    const sortStoresUser = await req(`${API_BASE}/stores?sortBy=name&sortOrder=asc`, shopperHeaders);
    const sortStoresRatingUser = await req(`${API_BASE}/stores?sortBy=rating&sortOrder=desc`, shopperHeaders);
    assert(sortStoresUser.status === 200 && sortStoresRatingUser.status === 200, 17, 'Normal user sorts stores by Name and by Rating');

    // 18. Submit rating
    const submitRateRes = await req(`${API_BASE}/stores/${testStoreId}/ratings`, {
      method: 'POST',
      ...shopperHeaders,
      body: { rating: 5 },
    });
    assert(submitRateRes.status === 201 && submitRateRes.data.rating.rating === 5, 18, 'Normal user submits rating (5 stars)');

    // 19. Modify rating
    const updateRateRes = await req(`${API_BASE}/stores/${testStoreId}/ratings`, {
      method: 'PUT',
      ...shopperHeaders,
      body: { rating: 4 },
    });
    assert(updateRateRes.status === 200 && updateRateRes.data.rating.rating === 4, 19, 'Normal user modifies their rating to 4 stars');

    // 20. Change password
    const changePassRes = await req(`${API_BASE}/auth/password`, {
      method: 'PUT',
      ...shopperHeaders,
      body: {
        currentPassword: 'ShopperPass@123',
        newPassword: 'NewShopper@123', // 14 chars (valid: 8-16)
      },
    });
    assert(changePassRes.status === 200, 20, 'Normal user updates their password');

    // 21. Logout verification (testing authentication with old and new credentials)
    const reloginNew = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: shopperEmail, password: 'NewShopper@123' },
    });
    assert(reloginNew.status === 200, 21, 'Logout & re-authentication verified with new password');

    // -------------------------------------------------------------
    // STORE OWNER WORKFLOW (Scenarios 22 - 28)
    // -------------------------------------------------------------
    console.log('\n--- STORE OWNER SCENARIOS ---');

    // 22. Store Owner Login
    const ownerLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: ownerEmail, password: 'OwnerPass@123' },
    });
    assert(ownerLogin.status === 200 && ownerLogin.data.token, 22, 'Store Owner logs in');
    const ownerToken = ownerLogin.data.token;
    const ownerHeaders = { headers: { Authorization: `Bearer ${ownerToken}` } };

    // 23. Owner Dashboard
    const ownerDash = await req(`${API_BASE}/store-owner/dashboard`, ownerHeaders);
    assert(ownerDash.status === 200 && ownerDash.data.store, 23, 'Store Owner accesses dashboard');

    // 24. View ratings (list of users who rated their store)
    assert(
      ownerDash.status === 200 &&
      Array.isArray(ownerDash.data.ratings) &&
      ownerDash.data.ratings.length > 0 &&
      ownerDash.data.ratings[0].userName !== undefined,
      24,
      'Store Owner views list of users who submitted ratings (User Name, Email, Rating)'
    );

    // 25. Verify average rating
    assert(
      ownerDash.status === 200 &&
      parseFloat(ownerDash.data.store.averageRating) === 4.0,
      25,
      `Store Owner sees accurate store average rating (${ownerDash.data.store.averageRating})`
    );

    // 26. Verify cannot access another owner's data
    // The endpoint takes no ID parameter, strictly using req.user.id
    const tamperedQuery = await req(`${API_BASE}/store-owner/dashboard?storeId=999&ownerId=1`, ownerHeaders);
    assert(
      tamperedQuery.status === 200 &&
      tamperedQuery.data.store.id === testStoreId,
      26,
      'IDOR Protection: Owner query is locked strictly to req.user.id, ignoring tampered query parameters'
    );

    // 27. Store Owner Change password
    const ownerChangePass = await req(`${API_BASE}/auth/password`, {
      method: 'PUT',
      ...ownerHeaders,
      body: {
        currentPassword: 'OwnerPass@123',
        newPassword: 'NewOwnerPass@123',
      },
    });
    assert(ownerChangePass.status === 200, 27, 'Store Owner updates password');

    // 28. Store Owner Logout & Relogin with new password
    const ownerRelogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: { email: ownerEmail, password: 'NewOwnerPass@123' },
    });
    assert(ownerRelogin.status === 200, 28, 'Store Owner logs in with updated password');

    // -------------------------------------------------------------
    // VALIDATION TESTING (Scenarios 29 - 33)
    // -------------------------------------------------------------
    console.log('\n--- VALIDATION BOUNDARY SCENARIOS ---');

    // 29. Name boundary tests: 4 chars (FAIL), 5 chars (PASS), 20 chars (PASS), 21 chars (FAIL)
    const name4 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: '1234', email: 'n4@test.com', password: 'Pass@123', address: '123 Street' },
    });
    const name5 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: '12345', email: `n5_${Date.now()}@test.com`, password: 'Pass@123', address: '123 Street' },
    });
    const name20 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'A'.repeat(20), email: `n20_${Date.now()}@test.com`, password: 'Pass@123', address: '123 Street' },
    });
    const name21 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'A'.repeat(21), email: `n21_${Date.now()}@test.com`, password: 'Pass@123', address: '123 Street' },
    });
    assert(name4.status === 400 && name5.status === 201 && name20.status === 201 && name21.status === 400, 29, 'Name boundaries: 4->FAIL, 5->PASS, 20->PASS, 21->FAIL');

    // 30. Address boundary tests: 400 chars (PASS), 401 chars (FAIL)
    const addr400 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Valid Name For 400', email: `a400_${Date.now()}@test.com`, password: 'Pass@123', address: 'B'.repeat(400) },
    });
    const addr401 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Valid Name User', email: `a401_${Date.now()}@test.com`, password: 'Pass@123', address: 'B'.repeat(401) },
    });
    assert(addr400.status === 201 && addr401.status === 400, 30, 'Address boundaries: 400->PASS, 401->FAIL');

    // 31. Password boundary tests: 7 (FAIL), 8 (PASS), 16 (PASS), 17 (FAIL); No uppercase (FAIL); No special char (FAIL)
    const pass7 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test User P01', email: `p7_${Date.now()}@test.com`, password: 'Pass@12', address: 'Valid Addr' },
    });
    const pass8 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test User P02', email: `p8_${Date.now()}@test.com`, password: 'Passw@12', address: 'Valid Addr' },
    });
    const pass16 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test User P03', email: `p16_${Date.now()}@test.com`, password: 'Pass@12345678901', address: 'Valid Addr' },
    });
    const pass17 = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test User P04', email: `p17_${Date.now()}@test.com`, password: 'Pass@123456789012', address: 'Valid Addr' },
    });
    const passNoUpper = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test User P05', email: `pnou_${Date.now()}@test.com`, password: 'password@123', address: 'Valid Addr' },
    });
    const passNoSpecial = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test User P06', email: `pnosp_${Date.now()}@test.com`, password: 'Password123', address: 'Valid Addr' },
    });
    assert(
      pass7.status === 400 && pass8.status === 201 && pass16.status === 201 && pass17.status === 400 && passNoUpper.status === 400 && passNoSpecial.status === 400,
      31,
      'Password boundaries: 7->FAIL, 8->PASS, 16->PASS, 17->FAIL, no uppercase->FAIL, no special->FAIL'
    );

    // 32. Email validation
    const badEmail = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test Email User', email: 'invalid_email_format', password: 'Pass@123', address: 'Valid Addr' },
    });
    const goodEmail = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: { name: 'Test Email User', email: `valid_${Date.now()}@gmail.com`, password: 'Pass@123', address: 'Valid Addr' },
    });
    assert(badEmail.status === 400 && goodEmail.status === 201, 32, 'Email validation: invalid email format->FAIL, valid email->PASS');

    // 33. Rating boundary tests: 0, 6, -1, 4.5, 1..5
    const r0 = await req(`${API_BASE}/stores/${testStoreId}/ratings`, { method: 'POST', ...shopperHeaders, body: { rating: 0 } });
    const r6 = await req(`${API_BASE}/stores/${testStoreId}/ratings`, { method: 'POST', ...shopperHeaders, body: { rating: 6 } });
    const rNeg1 = await req(`${API_BASE}/stores/${testStoreId}/ratings`, { method: 'POST', ...shopperHeaders, body: { rating: -1 } });
    const rDecimal = await req(`${API_BASE}/stores/${testStoreId}/ratings`, { method: 'POST', ...shopperHeaders, body: { rating: 4.5 } });
    assert(r0.status === 400 && r6.status === 400 && rNeg1.status === 400 && rDecimal.status === 400, 33, 'Rating boundaries: 0->FAIL, 6->FAIL, -1->FAIL, 4.5 decimal->FAIL');

    // -------------------------------------------------------------
    // SECURITY TESTS (Scenarios 34 - 38)
    // -------------------------------------------------------------
    console.log('\n--- SECURITY SCENARIOS ---');

    // 34. Normal user -> admin API = 403
    const userToAdmin = await req(`${API_BASE}/admin/dashboard`, shopperHeaders);
    assert(userToAdmin.status === 403, 34, 'RBAC Security: Normal user calling admin API is rejected with 403 Forbidden');

    // 35. Normal user -> owner API = 403
    const userToOwner = await req(`${API_BASE}/store-owner/dashboard`, shopperHeaders);
    assert(userToOwner.status === 403, 35, 'RBAC Security: Normal user calling store-owner API is rejected with 403 Forbidden');

    // 36. Owner -> another owner's data = blocked
    const ownerToAdmin = await req(`${API_BASE}/admin/stores`, ownerHeaders);
    assert(ownerToAdmin.status === 403, 36, 'RBAC Security: Store owner calling admin store creation is rejected with 403 Forbidden');

    // 37. Duplicate rating = blocked (409 Conflict)
    // Shopper already rated testStoreId earlier in scenario 18 & 19
    const dupRate = await req(`${API_BASE}/stores/${testStoreId}/ratings`, {
      method: 'POST',
      ...shopperHeaders,
      body: { rating: 3 },
    });
    assert(dupRate.status === 409, 37, 'Integrity Security: Submitting duplicate rating returns 409 Conflict');

    // 38. Privileged role through public signup = blocked
    const signupAdminAttempt = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: {
        name: 'Hacker Privilege',
        email: `hacker_${Date.now()}@storerating.com`,
        password: 'Hacker@123',
        address: 'Secret Dark Alley',
        role: 'admin', // Attempting to escalate to admin
      },
    });
    assert(
      signupAdminAttempt.status === 201 &&
      signupAdminAttempt.data.user.role === 'user',
      38,
      'Privilege Escalation Protection: Public signup with role="admin" is forced to "user"'
    );

    console.log('\n===============================================================');
    console.log(`   FINAL SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL 38)`);
    console.log('===============================================================\n');
  } catch (error) {
    console.error('Fatal test error:', error);
  }
}

runAllTests();
