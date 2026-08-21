const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../tests/data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Common edge-case injection and security payloads
const SQL_INJECTION = ["' OR '1'='1", "admin' --", "1; DROP TABLE users;--", "' UNION SELECT null, username, password FROM users--"];
const XSS_PAYLOADS = ["<script>alert('XSS')</script>", "<img src=x onerror=alert(1)>", "javascript:alert(document.cookie)", "<svg/onload=alert('XSS')>"];
const UNICODE_STRINGS = ["Nguyễn Văn Đạt", "Tiếng Việt có dấu: ă, â, đ, ê, ô, ơ, ư", "こんにちは世界 (Hello World)", "🌟🔥🚀🎉 Đơn hàng VIP", "العربية"];
const LARGE_PAYLOAD = "A".repeat(5000);

const modules = [
  { name: 'login', primaryKey: 'email' },
  { name: 'register', primaryKey: 'email' },
  { name: 'user', primaryKey: 'userId' },
  { name: 'customer', primaryKey: 'customerId' },
  { name: 'address', primaryKey: 'addressId' },
  { name: 'category', primaryKey: 'categoryId' },
  { name: 'brand', primaryKey: 'brandId' },
  { name: 'product', primaryKey: 'productId' },
  { name: 'variant', primaryKey: 'variantId' },
  { name: 'inventory', primaryKey: 'inventoryId' },
  { name: 'warehouse', primaryKey: 'warehouseId' },
  { name: 'cart', primaryKey: 'cartId' },
  { name: 'wishlist', primaryKey: 'wishlistId' },
  { name: 'coupon', primaryKey: 'couponCode' },
  { name: 'promotion', primaryKey: 'promotionId' },
  { name: 'checkout', primaryKey: 'checkoutId' },
  { name: 'payment', primaryKey: 'paymentId' },
  { name: 'order', primaryKey: 'orderId' },
  { name: 'refund', primaryKey: 'refundId' },
  { name: 'return', primaryKey: 'returnId' },
  { name: 'shipment', primaryKey: 'shipmentId' },
  { name: 'review', primaryKey: 'reviewId' },
  { name: 'notification', primaryKey: 'notificationId' },
  { name: 'admin', primaryKey: 'adminId' },
  { name: 'role', primaryKey: 'roleId' },
  { name: 'permission', primaryKey: 'permissionId' }
];

function generateDatasetForModule(mod) {
  return {
    module: mod.name,
    metadata: {
      generatedAt: new Date().toISOString(),
      standard: "Senior QA & Security Test Automation Suite",
      categories: [
        "Positive", "Negative", "Boundary Value Analysis (BVA)",
        "Equivalence Partitioning (EP)", "Null", "Empty", "Duplicate",
        "Special Character", "Unicode", "Invalid Format", "SQL Injection",
        "XSS", "Expired Token", "Wrong Permission", "Large Payload",
        "Concurrent", "Random Data"
      ]
    },
    positive: [
      {
        scenarioId: `${mod.name.toUpperCase()}_POS_001`,
        description: `Valid standard ${mod.name} creation/operation`,
        data: {
          [mod.primaryKey]: `VALID_${mod.name.toUpperCase()}_01`,
          status: "ACTIVE",
          name: `Standard Valid ${mod.name}`,
          amount: 1500000,
          quantity: 2,
          email: `test.${mod.name}@miniecommerce.com`,
          createdAt: new Date().toISOString()
        },
        expectedResult: { statusCode: 200, success: true }
      },
      {
        scenarioId: `${mod.name.toUpperCase()}_POS_002`,
        description: `Valid secondary flow for ${mod.name}`,
        data: {
          [mod.primaryKey]: `VALID_${mod.name.toUpperCase()}_02`,
          status: "CONFIRMED",
          name: `Secondary Valid ${mod.name}`,
          amount: 50000000,
          quantity: 10,
          email: `vip.${mod.name}@miniecommerce.com`
        },
        expectedResult: { statusCode: 200, success: true }
      }
    ],
    negative: [
      {
        scenarioId: `${mod.name.toUpperCase()}_NEG_001`,
        description: `Invalid payload missing mandatory identifier for ${mod.name}`,
        data: { [mod.primaryKey]: "" },
        expectedResult: { statusCode: 400, errorCode: "VALIDATION_FAILED" }
      },
      {
        scenarioId: `${mod.name.toUpperCase()}_NEG_002`,
        description: `Invalid data type mismatch for ${mod.name}`,
        data: { amount: "INVALID_NUMBER_STRING", quantity: -10 },
        expectedResult: { statusCode: 400, errorCode: "TYPE_MISMATCH" }
      }
    ],
    boundaryValueAnalysis: [
      {
        scenarioId: `${mod.name.toUpperCase()}_BVA_MIN_001`,
        description: "Minimum valid boundary value (e.g. quantity=1, amount=1000)",
        data: { quantity: 1, amount: 1000, length: 1 },
        expectedResult: { statusCode: 200, success: true }
      },
      {
        scenarioId: `${mod.name.toUpperCase()}_BVA_MAX_001`,
        description: "Maximum allowable boundary limit (e.g. max quantity=999, amount=999999999)",
        data: { quantity: 999, amount: 999999999, length: 255 },
        expectedResult: { statusCode: 200, success: true }
      },
      {
        scenarioId: `${mod.name.toUpperCase()}_BVA_EXCEED_001`,
        description: "Out-of-boundary overflow value",
        data: { quantity: 1000, amount: 1000000000000 },
        expectedResult: { statusCode: 422, errorCode: "OUT_OF_BOUNDS" }
      }
    ],
    equivalencePartitioning: [
      {
        scenarioId: `${mod.name.toUpperCase()}_EP_VALID_CLASS`,
        partition: "Valid class (standard range)",
        data: { amount: 2500000, discountPct: 15, quantity: 3 },
        expectedResult: { statusCode: 200, success: true }
      },
      {
        scenarioId: `${mod.name.toUpperCase()}_EP_INVALID_NEGATIVE_CLASS`,
        partition: "Invalid class (negative value)",
        data: { amount: -50000, discountPct: -5, quantity: -1 },
        expectedResult: { statusCode: 400, errorCode: "NEGATIVE_NOT_ALLOWED" }
      }
    ],
    nullValues: [
      {
        scenarioId: `${mod.name.toUpperCase()}_NULL_001`,
        description: "Null primary identifier",
        data: { [mod.primaryKey]: null, name: null },
        expectedResult: { statusCode: 400, errorCode: "FIELD_REQUIRED" }
      }
    ],
    emptyValues: [
      {
        scenarioId: `${mod.name.toUpperCase()}_EMPTY_001`,
        description: "Empty strings and arrays",
        data: { [mod.primaryKey]: "", items: [], tags: [] },
        expectedResult: { statusCode: 400, errorCode: "EMPTY_NOT_ALLOWED" }
      }
    ],
    duplicates: [
      {
        scenarioId: `${mod.name.toUpperCase()}_DUP_001`,
        description: "Duplicate unique key insertion",
        data: { [mod.primaryKey]: `DUPLICATE_KEY_${mod.name.toUpperCase()}` },
        expectedResult: { statusCode: 409, errorCode: "DUPLICATE_ENTITY" }
      }
    ],
    specialCharacters: [
      {
        scenarioId: `${mod.name.toUpperCase()}_SPEC_001`,
        description: "Special symbol character handling",
        data: { name: "!@#$%^&*()_+{}|:\"<>?~`-=[]\\;',./" },
        expectedResult: { statusCode: 200, sanitized: true }
      }
    ],
    unicode: [
      {
        scenarioId: `${mod.name.toUpperCase()}_UNICODE_001`,
        description: "Vietnamese UTF-8 & Emoji character support",
        data: { name: UNICODE_STRINGS[0], note: UNICODE_STRINGS[1], tag: UNICODE_STRINGS[3] },
        expectedResult: { statusCode: 200, success: true }
      }
    ],
    invalidFormat: [
      {
        scenarioId: `${mod.name.toUpperCase()}_FMT_001`,
        description: "Malformed email / UUID / date format",
        data: { email: "not-an-email", uuid: "1234-invalid-uuid", date: "32/13/2026" },
        expectedResult: { statusCode: 400, errorCode: "INVALID_FORMAT" }
      }
    ],
    sqlInjection: SQL_INJECTION.map((payload, idx) => ({
      scenarioId: `${mod.name.toUpperCase()}_SQLI_00${idx + 1}`,
      description: `SQL Injection vector test #${idx + 1}`,
      payload: payload,
      data: { [mod.primaryKey]: payload, search: payload, query: payload },
      expectedResult: { statusCode: 400, neutralized: true }
    })),
    xss: XSS_PAYLOADS.map((payload, idx) => ({
      scenarioId: `${mod.name.toUpperCase()}_XSS_00${idx + 1}`,
      description: `Cross-Site Scripting vector test #${idx + 1}`,
      payload: payload,
      data: { name: payload, comment: payload, review: payload },
      expectedResult: { statusCode: 200, sanitized: true }
    })),
    expiredToken: [
      {
        scenarioId: `${mod.name.toUpperCase()}_AUTH_EXPIRED_001`,
        description: "Access using expired JWT bearer token",
        authHeader: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.expiredTokenPayload",
        expectedResult: { statusCode: 401, errorCode: "TOKEN_EXPIRED" }
      }
    ],
    wrongPermission: [
      {
        scenarioId: `${mod.name.toUpperCase()}_PERM_FORBIDDEN_001`,
        description: "Customer role accessing Admin-only endpoint",
        userRole: "ROLE_CUSTOMER",
        targetAction: "ADMIN_ONLY_OPERATION",
        expectedResult: { statusCode: 403, errorCode: "ACCESS_DENIED" }
      }
    ],
    largePayload: [
      {
        scenarioId: `${mod.name.toUpperCase()}_LARGE_001`,
        description: "5KB buffer stress payload",
        data: { description: LARGE_PAYLOAD },
        expectedResult: { statusCode: 413, errorCode: "PAYLOAD_TOO_LARGE" }
      }
    ],
    concurrentRequests: [
      {
        scenarioId: `${mod.name.toUpperCase()}_CONCURRENT_001`,
        description: "Simulate 50 parallel requests for race conditions",
        concurrencyLevel: 50,
        idempotencyKey: `IDEMP_${mod.name.toUpperCase()}_${Date.now()}`,
        expectedResult: { raceConditionHandled: true, singleExecutionGuaranteed: true }
      }
    ],
    randomData: [
      {
        scenarioId: `${mod.name.toUpperCase()}_FUZZ_001`,
        description: "Fuzz testing with pseudo-random seed",
        data: {
          randomString: Math.random().toString(36).substring(2),
          randomNumber: Math.floor(Math.random() * 1000000),
          randomTimestamp: Date.now() - Math.floor(Math.random() * 10000000)
        }
      }
    ]
  };
}

modules.forEach(mod => {
  const filePath = path.join(targetDir, `${mod.name}.json`);
  const dataset = generateDatasetForModule(mod);
  fs.writeFileSync(filePath, JSON.stringify(dataset, null, 2), 'utf8');
  console.log(`Created test dataset: ${mod.name}.json`);
});

console.log(`\nSuccessfully created all ${modules.length} test dataset files in ${targetDir}`);
