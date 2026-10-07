/**
 * End-to-end smoke test against the running GeoFix API.
 * Mirrors the exact requests `services/local-api.ts` issues, in the same order
 * the mobile app performs them, to catch runtime contract mismatches that
 * `tsc` cannot see.
 */
const BASE = process.env.BASE ?? 'http://localhost:4000';

let pass = 0;
let fail = 0;
const failures = [];

function check(name, condition, detail) {
  if (condition) {
    pass += 1;
    console.log(`  PASS  ${name}`);
  } else {
    fail += 1;
    failures.push(`${name}${detail ? ` -- ${detail}` : ''}`);
    console.log(`  FAIL  ${name}${detail ? ` -- ${detail}` : ''}`);
  }
}

async function call(token, method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { status: res.status, ok: res.ok, json };
}

const stamp = Date.now();
const phoneSuffix = String(stamp).slice(-7);
const customer = {
  name: 'Smoke Customer',
  email: `smoke.cust.${stamp}@geofix.test`,
  password: 'Passw0rd!23',
  phone: 9876 + phoneSuffix,
};
const worker = {
  name: 'Smoke Worker',
  email: `smoke.work.${stamp}@geofix.test`,
  password: 'Passw0rd!23',
  phone: 9877 + phoneSuffix,
  categorySkills: ['Plumbing'],
};

(async () => {
  console.log(`\nGeoFix API smoke test -> ${BASE}\n`);

  // ---------- health ----------
  console.log('health');
  const health = await call(null, 'GET', '/health');
  check('GET /health returns 200', health.ok, `got ${health.status}`);
  check('health reports local-api mode', health.json?.mode === 'local-api');

  // ---------- auth ----------
  console.log('\nauth');
  const custSignup = await call(null, 'POST', '/auth/signup', { ...customer, role: 'customer' });
  check('customer signup 200', custSignup.status === 200, JSON.stringify(custSignup.json));
  const custToken = custSignup.json?.accessToken;
  check('customer signup returns accessToken', typeof custToken === 'string');
  check('customer signup returns uid', typeof custSignup.json?.user?.id === 'string');

  const workSignup = await call(null, 'POST', '/auth/signup', { ...worker, role: 'worker' });
  check('worker signup 200', workSignup.status === 200, JSON.stringify(workSignup.json));
  const workToken = workSignup.json?.accessToken;
  const workerId = workSignup.json?.user?.id;
  check('worker signup returns accessToken + uid', typeof workToken === 'string' && typeof workerId === 'string');

  const login = await call(null, 'POST', '/auth/login', {
    email: customer.email,
    password: customer.password,
  });
  check('customer login 200', login.ok, JSON.stringify(login.json));

  const badLogin = await call(null, 'POST', '/auth/login', {
    email: customer.email,
    password: 'wrong-password',
  });
  check('wrong password rejected', badLogin.status === 401, `got ${badLogin.status}`);

  const me = await call(custToken, 'GET', '/users/me');
  check('GET /users/me 200', me.ok, `got ${me.status}`);
  check('/users/me echoes email', me.json?.email === customer.email);

  const noAuth = await call(null, 'GET', '/users/me');
  check('unauthenticated /users/me is 401', noAuth.status === 401, `got ${noAuth.status}`);

  const badToken = await call('not-a-real-token', 'GET', '/users/me');
  check('garbage token is 401', badToken.status === 401, `got ${badToken.status}`);

  // ---------- worker profile ----------
  console.log('\nworker profile');
  const workerProfile = await call(workToken, 'GET', `/workers/${workerId}`);
  check('GET /workers/:id 200', workerProfile.ok, JSON.stringify(workerProfile.json));
  check('worker starts unverified', workerProfile.json?.verificationStatus === 'pending',
    `got ${workerProfile.json?.verificationStatus}`);
  check('worker starts offline', workerProfile.json?.isOnline === false,
    `got ${workerProfile.json?.isOnline}`);

  const slots = [
    { day: 'Mon', from: '09:00', to: '18:00' },
    { day: 'Tue', from: '10:00', to: '19:00' },
    { day: 'BadDay', from: '10:00', to: '19:00' },
    { day: 'Wed', from: '99:99', to: '19:00' },
  ];
  const profPatch = await call(workToken, 'PATCH', `/workers/${workerId}/profile`, {
    categorySkills: ['Plumbing', 'Plumbing', 'Electrical'],
    availableSlots: slots,
    address: 'Test street',
  });
  check('PATCH /workers/:id/profile 200', profPatch.ok, JSON.stringify(profPatch.json));
  check('skills de-duplicated by server', JSON.stringify(profPatch.json?.categorySkills) === '["Plumbing","Electrical"]',
    JSON.stringify(profPatch.json?.categorySkills));
  check('invalid slot days dropped', profPatch.json?.availableSlots?.length === 2,
    `got ${profPatch.json?.availableSlots?.length}`);

  const badAvailability = await call(workToken, 'PATCH', `/workers/${workerId}/availability`, { isOnline: true });
  check('PATCH availability 200', badAvailability.ok, JSON.stringify(badAvailability.json));

  const custPatchesWorker = await call(custToken, 'PATCH', `/workers/${workerId}/availability`, { isOnline: false });
  check('customer cannot set worker availability (403)', custPatchesWorker.status === 403,
    `got ${custPatchesWorker.status}`);

  // verification -> admin approves
  const verification = await call(workToken, 'POST', `/workers/${workerId}/verification`, {
    govIdUrl: 'data:image/png;base64,iVBORw0KGgo=',
    name: worker.name,
  });
  check('POST verification 200', verification.ok, JSON.stringify(verification.json));

  // ---------- request creation ----------
  console.log('\nrequests');
  const create = await call(custToken, 'POST', '/requests', {
    customerName: customer.name,
    category: 'Plumbing',
    title: 'Leaking kitchen tap',
    description: 'Dripping badly',
    photoUrls: [],
    location: { latitude: 9.9252, longitude: 78.1198 },
    address: '12 Anna Salai',
    pincode: '625001',
    area: 'Anna Nagar',
    whatsappNumber: customer.phone,
  });
  check('POST /requests 201', create.status === 201, JSON.stringify(create.json));
  const requestId = create.json?.id;
  check('created request has id', typeof requestId === 'string');
  check('created request status is searching', create.json?.status === 'searching',
    `got ${create.json?.status}`);
  check('location round-trips as lat/lng',
    create.json?.customerLocation?.latitude === 9.9252 &&
    create.json?.customerLocation?.longitude === 78.1198,
    JSON.stringify(create.json?.customerLocation));

  const badCreate = await call(custToken, 'POST', '/requests', {
    category: 'Plumbing',
    title: 'No location',
    location: 'not-a-point',
  });
  check('POST /requests without valid location is 400', badCreate.status === 400,
    `got ${badCreate.status}`);

  const workerCreates = await call(workToken, 'POST', '/requests', {
    category: 'Plumbing',
    title: 'Worker should not create',
    location: { latitude: 9.92, longitude: 78.11 },
  });
  check('worker cannot create a request (403)', workerCreates.status === 403,
    `got ${workerCreates.status}`);

  const mine = await call(custToken, 'GET', '/requests/mine');
  check('GET /requests/mine 200', mine.ok, `got ${mine.status}`);
  check('mine contains the new request',
    Array.isArray(mine.json) && mine.json.some((r) => r.id === requestId));

  // assign should fail while worker is unapproved
  const assignUnverified = await call(custToken, 'PATCH', `/requests/${requestId}/assign`, {
    workerId,
    workerName: worker.name,
  });
  check('cannot assign unverified worker (409)', assignUnverified.status === 409,
    `got ${assignUnverified.status}: ${assignUnverified.json?.message}`);

  // admin approves the worker
  console.log('\nadmin');
  const queue = await call(custToken, 'GET', '/admin/verification-queue');
  check('customer cannot read verification queue (403)', queue.status === 403, `got ${queue.status}`);

  // find an admin account from the seed data
  const adminLogin = await call(null, 'POST', '/auth/login', {
    email: process.env.ADMIN_EMAIL ?? 'admin@geofix.local',
    password: process.env.ADMIN_PASSWORD ?? 'Admin@123',
  });
  check('admin login 200', adminLogin.ok, JSON.stringify(adminLogin.json));
  const adminToken = adminLogin.json?.accessToken;

  if (adminToken) {
    const review = await call(adminToken, 'PATCH', `/admin/verification-queue/${workerId}`, {
      status: 'approved',
    });
    check('admin approves worker 200', review.ok, JSON.stringify(review.json));

    const activeStats = await call(adminToken, 'GET', '/admin/stats/active');
    check('GET /admin/stats/active 200', activeStats.ok, JSON.stringify(activeStats.json));
    check('stats expose activeRequests', typeof activeStats.json?.activeRequests === 'number',
      JSON.stringify(activeStats.json));

    const ratingDist = await call(adminToken, 'GET', '/admin/stats/ratings');
    check('GET /admin/stats/ratings 200', ratingDist.ok, JSON.stringify(ratingDist.json));

    const adminRequests = await call(adminToken, 'GET', '/admin/requests');
    check('GET /admin/requests 200', adminRequests.ok, `got ${adminRequests.status}`);
    check('admin sees the smoke request',
      Array.isArray(adminRequests.json) && adminRequests.json.some((r) => r.id === requestId));

    const adminUsers = await call(adminToken, 'GET', '/admin/users');
    check('GET /admin/users 200', adminUsers.ok, `got ${adminUsers.status}`);

    const audit = await call(adminToken, 'GET', '/admin/audit-log');
    check('GET /admin/audit-log 200', audit.ok, `got ${audit.status}`);
    check('audit log records create_request',
      Array.isArray(audit.json) && audit.json.some((a) => a.action === 'create_request'));

    const adminDetail = await call(adminToken, 'GET', `/requests/${requestId}`);
    check('admin can read any request detail', adminDetail.ok, `got ${adminDetail.status}`);

    const disputes = await call(adminToken, 'GET', '/admin/disputes');
    check('GET /admin/disputes 200', disputes.ok, `got ${disputes.status}`);
  } else {
    console.log('  SKIP  admin checks (no admin credentials available)');
  }

  // ---------- nearby workers (now approved + online) ----------
  console.log('\nnearby workers');
  await call(workToken, 'PATCH', `/workers/${workerId}/availability`, { isOnline: true });
  const nearby = await call(custToken, 'GET',
    '/workers/nearby?lat=9.9252&lng=78.1198&radiusKm=15');
  check('GET /workers/nearby 200', nearby.ok, JSON.stringify(nearby.json));
  check('approved+online worker appears nearby',
    Array.isArray(nearby.json) && nearby.json.some((w) => w.userId === workerId));
  const nearbyRow = Array.isArray(nearby.json) ? nearby.json.find((w) => w.userId === workerId) : null;
  check('nearby row carries _distance in metres', typeof nearbyRow?._distance === 'number',
    JSON.stringify(nearbyRow?._distance));
  check('nearby row carries rating + ratingCount',
    typeof nearbyRow?.rating === 'number' && typeof nearbyRow?.ratingCount === 'number');

  const nearbyNoParams = await call(custToken, 'GET', '/workers/nearby');
  check('nearby without lat/lng is 400', nearbyNoParams.status === 400, `got ${nearbyNoParams.status}`);

  // ---------- full job lifecycle ----------
  console.log('\njob lifecycle');
  const assign = await call(custToken, 'PATCH', `/requests/${requestId}/assign`, {
    workerId,
    workerName: worker.name,
  });
  check('customer assigns verified worker', assign.ok, JSON.stringify(assign.json));
  check('assign moves status to pending_worker_response',
    assign.json?.status === 'pending_worker_response', `got ${assign.json?.status}`);

  const assignAgain = await call(custToken, 'PATCH', `/requests/${requestId}/assign`, {
    workerId,
    workerName: worker.name,
  });
  check('cannot assign twice (409)', assignAgain.status === 409, `got ${assignAgain.status}`);

  const incoming = await call(workToken, 'GET', '/requests/incoming');
  check('GET /requests/incoming 200', incoming.ok, `got ${incoming.status}`);
  check('assigned job shows in worker incoming',
    Array.isArray(incoming.json) && incoming.json.some((r) => r.id === requestId));

  const incomingForCustomer = await call(custToken, 'GET', '/requests/incoming');
  check('customer cannot read incoming (403)', incomingForCustomer.status === 403,
    `got ${incomingForCustomer.status}`);

  const accept = await call(workToken, 'PATCH', `/requests/${requestId}/accept`, {});
  check('worker accepts job', accept.ok, JSON.stringify(accept.json));
  check('accept sets status accepted', accept.json?.status === 'accepted', `got ${accept.json?.status}`);
  check('accept records a jobUpdate',
    Array.isArray(accept.json?.jobUpdates) && accept.json.jobUpdates.some((u) => u.status === 'accepted'));

  const acceptByCustomer = await call(custToken, 'PATCH', `/requests/${requestId}/accept`, {});
  check('customer cannot accept (403)', acceptByCustomer.status === 403, `got ${acceptByCustomer.status}`);

  // invalid transition: accepted -> arrived (skips on_the_way)
  const skipStep = await call(workToken, 'PATCH', `/requests/${requestId}/progress`, { status: 'arrived' });
  check('skipping on_the_way is rejected (409)', skipStep.status === 409, `got ${skipStep.status}`);

  const bogusStatus = await call(workToken, 'PATCH', `/requests/${requestId}/progress`, { status: 'completed' });
  check('bogus progress status rejected (400)', bogusStatus.status === 400, `got ${bogusStatus.status}`);

  for (const step of ['on_the_way', 'arrived', 'in_progress']) {
    const res = await call(workToken, 'PATCH', `/requests/${requestId}/progress`, { status: step });
    check(`progress -> ${step}`, res.ok && res.json?.status === step,
      `got ${res.status} ${JSON.stringify(res.json?.status)}`);
  }

  const workerJobs = await call(workToken, 'GET', `/requests/worker/${workerId}`);
  check('GET /requests/worker/:id 200', workerJobs.ok, `got ${workerJobs.status}`);
  check('job history includes the active job',
    Array.isArray(workerJobs.json) && workerJobs.json.some((r) => r.id === requestId));

  const otherWorkerJobs = await call(workToken, 'GET', '/requests/worker/someone-else');
  check('worker cannot read another worker history (403)', otherWorkerJobs.status === 403,
    `got ${otherWorkerJobs.status}`);

  const complete = await call(workToken, 'PATCH', `/requests/${requestId}/complete`, {
    productsCost: 400,
    laborWage: 250,
    note: 'Replaced the washer',
  });
  check('worker completes job', complete.ok, JSON.stringify(complete.json));
  check('complete sets status completed', complete.json?.status === 'completed');
  check('bill total is computed server-side', complete.json?.bill?.total === 650,
    JSON.stringify(complete.json?.bill));
  check('paymentStatus starts pending', complete.json?.paymentStatus === 'pending',
    `got ${complete.json?.paymentStatus}`);

  const negativeBill = await call(workToken, 'PATCH', `/requests/${requestId}/complete`, {
    productsCost: -5,
    laborWage: 10,
  });
  check('negative bill rejected (400/409)', [400, 409].includes(negativeBill.status),
    `got ${negativeBill.status}`);

  const payBad = await call(custToken, 'POST', `/requests/${requestId}/pay`, { paymentMethod: 'crypto' });
  check('invalid payment method rejected (400)', payBad.status === 400, `got ${payBad.status}`);

  const pay = await call(custToken, 'POST', `/requests/${requestId}/pay`, { paymentMethod: 'cash' });
  check('customer pays bill', pay.ok, JSON.stringify(pay.json));
  check('paymentStatus becomes paid', pay.json?.paymentStatus === 'paid', `got ${pay.json?.paymentStatus}`);
  check('paymentMethod persisted', pay.json?.paymentMethod === 'cash');

  const doublePay = await call(custToken, 'POST', `/requests/${requestId}/pay`, { paymentMethod: 'cash' });
  check('double pay is blocked or idempotent', [200, 409].includes(doublePay.status),
    `got ${doublePay.status}`);

  // ---------- ratings ----------
  console.log('\nratings');
  const rate = await call(custToken, 'POST', '/ratings', {
    requestId,
    workerId,
    customerId: custSignup.json?.user?.id,
    customerName: customer.name,
    rating: 5,
    comment: 'Fast and neat',
  });
  check('customer rates worker', rate.ok || rate.status === 409, JSON.stringify(rate.json));

  const rateByWorker = await call(workToken, 'POST', '/ratings', {
    requestId,
    workerId,
    customerId: custSignup.json?.user?.id,
    rating: 1,
  });
  check('worker cannot rate (403)', rateByWorker.status === 403, `got ${rateByWorker.status}`);

  const ratings = await call(custToken, 'GET', `/ratings?workerId=${workerId}`);
  check('GET /ratings?workerId 200', ratings.ok, `got ${ratings.status}`);

  const afterRating = await call(workToken, 'GET', `/workers/${workerId}`);
  check('worker rating updated after rating', afterRating.json?.ratingCount >= 1,
    `ratingCount=${afterRating.json?.ratingCount} rating=${afterRating.json?.rating}`);
  check('jobsCompleted incremented', afterRating.json?.jobsCompleted >= 1,
    `jobsCompleted=${afterRating.json?.jobsCompleted}`);

  // ---------- disputes ----------
  console.log('\ndisputes');
  const dispute = await call(custToken, 'POST', `/requests/${requestId}/dispute`, {
    reason: 'Overcharged',
    description: 'Charged more than quoted',
  });
  check('customer raises dispute', dispute.status === 201, JSON.stringify(dispute.json));
  check('dispute marked raisedBy=customer', dispute.json?.raisedBy === 'customer');
  check('dispute starts open', dispute.json?.status === 'open');

  const disputeNoReason = await call(custToken, 'POST', `/requests/${requestId}/dispute`, {
    description: 'no reason',
  });
  check('dispute without reason is 400', disputeNoReason.status === 400, `got ${disputeNoReason.status}`);

  if (adminToken) {
    const openDisputes = await call(adminToken, 'GET', '/admin/disputes?status=open');
    check('GET /admin/disputes?status=open 200', openDisputes.ok, `got ${openDisputes.status}`);
    check('new dispute appears in open list',
      Array.isArray(openDisputes.json) &&
      openDisputes.json.some((d) => d.id === dispute.json?.id));

    const resolve = await call(adminToken, 'PATCH', `/admin/disputes/${dispute.json?.id}`, {
      status: 'resolved',
      resolutionNote: 'Partial refund issued',
    });
    check('admin resolves dispute', resolve.ok, JSON.stringify(resolve.json));
    check('resolution note persisted', resolve.json?.resolutionNote === 'Partial refund issued');
  }

  // ---------- cancel path (fresh request) ----------
  console.log('\ncancel path');
  const second = await call(custToken, 'POST', '/requests', {
    customerName: customer.name,
    category: 'Painting',
    title: 'Repaint bedroom',
    description: '',
    location: { latitude: 9.93, longitude: 78.12 },
  });
  const secondId = second.json?.id;
  const cancel = await call(custToken, 'PATCH', `/requests/${secondId}/cancel`);
  check('customer cancels own request', cancel.ok, JSON.stringify(cancel.json));
  check('cancel sets status cancelled', cancel.json?.status === 'cancelled');

  const cancelCompleted = await call(custToken, 'PATCH', `/requests/${requestId}/cancel`);
  check('cannot cancel a completed job (409)', cancelCompleted.status === 409,
    `got ${cancelCompleted.status}`);

  // ---------- cross-user isolation ----------
  console.log('\nisolation');
  const otherCust = await call(null, 'POST', '/auth/signup', {
    name: 'Other Customer',
    email: `smoke.other.${stamp}@geofix.test`,
    password: 'Passw0rd!23',
    role: 'customer',
  });
  const otherToken = otherCust.json?.accessToken;
  const peek = await call(otherToken, 'GET', `/requests/${requestId}`);
  check('another customer cannot read the request (403/404)',
    [403, 404].includes(peek.status), `got ${peek.status}`);

  const cancelOthers = await call(otherToken, 'PATCH', `/requests/${secondId}/cancel`);
  check('cannot cancel another customer request', [403, 409].includes(cancelOthers.status),
    `got ${cancelOthers.status}`);

  const profileMe = await call(custToken, 'PATCH', '/users/me', {
    name: 'Smoke Customer Updated',
    phone: 9878 + phoneSuffix,
    pincode: '625002',
  });
  check('PATCH /users/me 200', profileMe.ok, JSON.stringify(profileMe.json));
  check('profile update persisted', profileMe.json?.name === 'Smoke Customer Updated',
    JSON.stringify(profileMe.json?.name));

  console.log(`\n${'-'.repeat(52)}`);
  console.log(`  passed: ${pass}   failed: ${fail}`);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach((f) => console.log(`  - ${f}`));
  }
  console.log('');
  process.exit(fail > 0 ? 1 : 0);
})().catch((e) => {
  console.error('\nSMOKE TEST CRASHED:', e);
  process.exit(2);
});