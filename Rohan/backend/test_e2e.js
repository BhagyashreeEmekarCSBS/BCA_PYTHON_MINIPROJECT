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

async function runTests() {
  console.log('=== STARTING AUTOMATED END-TO-END SYSTEM TESTS ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const health = await req(`${API_BASE}/health`);
    assert(health.status === 200 && health.data.status === 'OK', 'Server health check returns 200 OK');

    // 2. Admin Login
    const adminLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'admin@storerating.com',
        password: 'Admin@123',
      },
    });
    assert(adminLogin.status === 200 && adminLogin.data.token, 'Admin login successful and returned JWT');
    const adminToken = adminLogin.data.token;
    const adminHeaders = { headers: { Authorization: `Bearer ${adminToken}` } };

    // 3. Admin Dashboard stats
    const dashboard = await req(`${API_BASE}/admin/dashboard`, adminHeaders);
    assert(
      dashboard.status === 200 && typeof dashboard.data.totalUsers === 'number',
      `Admin dashboard returned stats: ${dashboard.data.totalUsers} users, ${dashboard.data.totalStores} stores, ${dashboard.data.totalRatings} ratings`
    );

    // 4. Admin creates Store Owner user
    let storeOwnerUser;
    const createOwnerRes = await req(`${API_BASE}/admin/users`, {
      method: 'POST',
      ...adminHeaders,
      body: {
        name: 'John Store Owner', // 16 chars (5-20)
        email: 'owner1@storerating.com',
        password: 'Owner@123', // 9 chars (valid: 8-16, uppercase, special char)
        address: '456 Retail Boulevard, Suite 101, Business Park',
        role: 'store_owner',
      },
    });
    if (createOwnerRes.status === 201) {
      storeOwnerUser = createOwnerRes.data.user;
      assert(true, 'Admin created Store Owner user');
    } else if (createOwnerRes.status === 409) {
      const users = await req(`${API_BASE}/admin/users?email=owner1@storerating.com`, adminHeaders);
      storeOwnerUser = users.data.users[0];
      assert(true, 'Store owner already exists, re-using');
    } else {
      assert(false, `Admin create Store Owner failed: ${JSON.stringify(createOwnerRes.data)}`);
    }

    // 5. Admin creates Normal user
    const createUserRes = await req(`${API_BASE}/admin/users`, {
      method: 'POST',
      ...adminHeaders,
      body: {
        name: 'Alice Regular', // 13 chars (5-20)
        email: 'alice1@storerating.com',
        password: 'Alice@123',
        address: '789 Elm Street, Residential District 4',
        role: 'user',
      },
    });
    assert(createUserRes.status === 201 || createUserRes.status === 409, 'Admin created Normal user (or already exists)');

    // 6. Test User Filtering and Sorting
    const usersList = await req(`${API_BASE}/admin/users?role=store_owner&sortBy=name&sortOrder=asc`, adminHeaders);
    assert(usersList.status === 200 && Array.isArray(usersList.data.users), 'Admin users filter by role=store_owner and sort by name works');

    // 7. Admin creates Store for storeOwnerUser
    let storeId;
    const storeEmail = `owner_store_${Date.now()}@organicmarket.com`;
    const storeRes = await req(`${API_BASE}/admin/stores`, {
      method: 'POST',
      ...adminHeaders,
      body: {
        name: 'Green Earth Organic Supermarket', // 32 chars
        email: storeEmail,
        address: '100 Eco Avenue, Green Zone Building 2',
        ownerId: storeOwnerUser ? storeOwnerUser.id : null,
      },
    });
    if (storeRes.status === 201) {
      storeId = storeRes.data.store.id;
      assert(true, `Admin created Store (ID: ${storeId}) for Store Owner`);
    } else {
      assert(false, `Admin create Store failed: ${JSON.stringify(storeRes.data)}`);
    }

    // 8. Normal User Signup
    const userEmail = `bob_${Date.now()}@storerating.com`;
    const signupRes = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: {
        name: 'Bob Rating User', // 15 chars (5-20)
        email: userEmail,
        password: 'BobPassword@123',
        address: '321 Maple Avenue, Rating District, Block 5',
      },
    });
    assert(signupRes.status === 201 && signupRes.data.token, 'Normal User Signup successful with JWT token');
    const userToken = signupRes.data.token;
    const userHeaders = { headers: { Authorization: `Bearer ${userToken}` } };

    // 9. Normal User views stores and searches
    const userStoresRes = await req(`${API_BASE}/stores?name=Green`, userHeaders);
    assert(userStoresRes.status === 200 && userStoresRes.data.stores.length > 0, 'Normal User searches and views stores list');

    // 10. Normal User submits rating (5 stars)
    const rateRes = await req(`${API_BASE}/stores/${storeId}/ratings`, {
      method: 'POST',
      ...userHeaders,
      body: { rating: 5 },
    });
    assert(rateRes.status === 201 && rateRes.data.rating.rating === 5, 'Normal User submits 5-star rating');

    // 11. Normal User modifies rating to 4 stars
    const updateRateRes = await req(`${API_BASE}/stores/${storeId}/ratings`, {
      method: 'PUT',
      ...userHeaders,
      body: { rating: 4 },
    });
    assert(updateRateRes.status === 200 && updateRateRes.data.rating.rating === 4, 'Normal User modifies rating to 4 stars');

    // 12. Normal User changes password
    const changePassRes = await req(`${API_BASE}/auth/password`, {
      method: 'PUT',
      ...userHeaders,
      body: {
        currentPassword: 'BobPassword@123',
        newPassword: 'BobNew@123',
      },
    });
    assert(changePassRes.status === 200, 'Normal User successfully changed password');

    // 13. Normal User login with new password
    const userRelogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: userEmail,
        password: 'BobNew@123',
      },
    });
    assert(userRelogin.status === 200, 'Normal User logged in with updated password');

    // 14. Store Owner Login & Dashboard
    const ownerLogin = await req(`${API_BASE}/auth/login`, {
      method: 'POST',
      body: {
        email: 'owner1@storerating.com',
        password: 'Owner@123',
      },
    });
    assert(ownerLogin.status === 200, 'Store Owner logged in successfully');
    const ownerToken = ownerLogin.data.token;
    const ownerHeaders = { headers: { Authorization: `Bearer ${ownerToken}` } };

    const ownerDash = await req(`${API_BASE}/store-owner/dashboard`, ownerHeaders);
    assert(
      ownerDash.status === 200 &&
      ownerDash.data.store &&
      Array.isArray(ownerDash.data.ratings),
      `Store Owner Dashboard verified: Store "${ownerDash.data.store.name}" with average rating ${ownerDash.data.store.averageRating} and ${ownerDash.data.ratings.length} user rating(s)`
    );

    // 15. Form validation checks (Name < 5 chars should be rejected)
    const shortNameRes = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: {
        name: 'Abc', // only 3 chars (<5)
        email: 'short@test.com',
        password: 'Pass@123',
        address: 'Valid address',
      },
    });
    assert(shortNameRes.status === 400, 'Validation: short name (<5 chars) was correctly rejected with 400');

    // 16. Weak password without special char should be rejected
    const weakPassRes = await req(`${API_BASE}/auth/signup`, {
      method: 'POST',
      body: {
        name: 'Valid Name User', // 15 chars (5-20)
        email: 'weakpass@test.com',
        password: 'WeakPassword123', // missing special char
        address: 'Valid address',
      },
    });
    assert(weakPassRes.status === 400, 'Validation: password without special char was correctly rejected with 400');

    console.log(`\n========================================`);
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log(`========================================\n`);
  } catch (error) {
    console.error('Fatal test error:', error);
  }
}

runTests();
