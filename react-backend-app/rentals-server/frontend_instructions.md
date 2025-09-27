# Frontend Integration Guide - Rentals Server API

This guide provides mock data and API integration instructions for frontend developers to build the UI components for the musical instrument rental platform.

## 1. Shop Management APIs

### 1.1 Create a Shop

**Endpoint:** `POST /api/shops`

**Request Body:**
```json
{
  "name": "Test Music Shop",
  "contact": {
    "name": "Shop Owner",
    "phone": "+919175668567",
    "email": "shop@test.com"
  },
  "pickup_address": "Kumar Pacific Mall, Pune - 411001"
}
```

**Expected Response:**
```json
{
  "success": true,
  "shop": {
    "_id": "68bdd34c04ba86c528b0e018",
    "name": "Test Music Shop",
    "contact": {
      "name": "Shop Owner",
      "phone": "+919175668567",
      "email": "shop@test.com"
    },
    "pickup_address": "Kumar Pacific Mall, Pune - 411001",
    "kyc": {
      "verification_status": "pending"
    },
    "borzo": {
      "pickup_locations": []
    },
    "compliance": {
      "documents": []
    },
    "createdAt": "2025-09-07T18:47:40.969Z",
    "updatedAt": "2025-09-07T18:47:40.969Z"
  }
}
```

### 1.2 Get All Shops

**Endpoint:** `GET /api/shops`

**Expected Response:**
```json
[
  {
    "_id": "68bdd34c04ba86c528b0e018",
    "name": "Test Music Shop",
    "contact": {
      "name": "Shop Owner",
      "phone": "+919175668567",
      "email": "shop@test.com"
    },
    "pickup_address": "Kumar Pacific Mall, Pune - 411001",
    "kyc": {
      "verification_status": "pending"
    },
    "razorpay": {
      "linked_account_id": "acc_RIE7tsq66eZWC3",
      "status": "created",
      "route_config": {
        "status": "needs_clarification"
      }
    }
  }
]
```

### 1.3 Get Single Shop

**Endpoint:** `GET /api/shops/:shopId`

**Example:** `GET /api/shops/68bdd34c04ba86c528b0e018`

## 2. Razorpay Integration APIs

### 2.1 Link Shop with Razorpay Account

**Endpoint:** `POST /api/razorpay/admin/link-account`

**Request Body:**
```json
{
  "vendorDetails": {
    "email": "vendor.harmony@example.com",
    "phone": "+919765432109",
    "reference_id": "harmony_music_001",
    "business_name": "Harmony Music Instruments",
    "business_type": "individual",
    "contact_name": "Kavya Nair",
    "profile": {
      "category": "arts_and_entertainment",
      "subcategory": "music",
      "addresses": {
        "operation": {
          "street1": "123 Music Street",
          "street2": "Near City Mall",
          "city": "Pune",
          "state": "Maharashtra",
          "postal_code": "411001",
          "country": "IN"
        }
      }
    }
  },
  "stakeholderDetails": {
    "name": "Kavya Nair",
    "email": "kavya@harmony.com",
    "phone": "+919765432109",
    "addresses": {
      "residential": {
        "street": "456 Residential Lane, Pune",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411002",
        "country": "IN"
      }
    },
    "kyc": {
      "pan": "ABCDE1234F"
    }
  },
  "shopId": "68bdd34c04ba86c528b0e018"
}
```

**Expected Response:**
```json
{
  "success": true,
  "linkedAccount": {
    "id": "acc_RIE7tsq66eZWC3",
    "type": "route",
    "status": "created",
    "email": "vendor.harmony@example.com",
    "phone": "+919765432109",
    "legal_business_name": "Harmony Music Instruments"
  },
  "stakeholder": {
    "id": "sth_RIE8abc123def",
    "name": "Kavya Nair",
    "email": "kavya@harmony.com"
  },
  "productConfig": {
    "id": "acc_prd_RIE7yHagPvy7Ej",
    "status": "under_review"
  }
}
```

### 2.2 Update Bank Details

**Endpoint:** `POST /api/razorpay/admin/update-bank-details/:account_id`

**Example:** `POST /api/razorpay/admin/update-bank-details/acc_RIE7tsq66eZWC3`

**Request Body:**
```json
{
  "ifsc": "KKBK0001770",
  "account_number": "7145529540",
  "beneficiary_name": "Yash Prasad Thipsay",
  "product_id": "acc_prd_RIE7yHagPvy7Ej",
  "shopId": "68bdd34c04ba86c528b0e018"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bank details updated and verified successfully",
  "product_config": {
    "id": "acc_prd_RIE7yHagPvy7Ej",
    "activation_status": "activated",
    "bank_details_verified": true
  }
}
```

### 2.3 Check Account Status

**Endpoint:** `GET /api/razorpay/admin/linked-accounts/:account_id/status`

**Expected Response:**
```json
{
  "success": true,
  "account_id": "acc_RIE7tsq66eZWC3",
  "account_status": "activated",
  "route_product_status": "activated",
  "ready_for_transfers": true,
  "business_name": "Harmony Music Instruments",
  "email": "vendor.harmony@example.com",
  "phone": "+919765432109"
}
```

## 3. Instrument Management APIs

### 3.1 Add Instrument to Shop

**Endpoint:** `POST /api/shops/:shopId/instruments`

**Request Body:**
```json
{
  "owner_shop_id": "68bdd34c04ba86c528b0e018",
  "type": "Percussion",
  "name": "Drum Set",
  "description": "Professional drum set for rental",
  "price_per_day": 100,
  "images": ["https://example.com/drum1.jpg", "https://example.com/drum2.jpg"],
  "tags": ["drums", "percussion", "professional"],
  "shipping_details": {
    "weight_kg": 15,
    "length_cm": 120,
    "width_cm": 80,
    "height_cm": 100,
    "fragile": true,
    "declared_value": 50000,
    "hsn_code": "9207"
  },
  "kyc_requirements": {
    "requires_user_kyc": false,
    "acceptable_docs": []
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "instrument": {
    "_id": "68bdd34d04ba86c528b0e01a",
    "owner_shop_id": "68bdd34c04ba86c528b0e018",
    "type": "Percussion",
    "name": "Drum Set",
    "description": "Professional drum set for rental",
    "price_per_day": 100,
    "availability_status": "available",
    "shipping_details": {
      "weight_kg": 15,
      "fragile": true,
      "declared_value": 50000
    },
    "createdAt": "2025-09-07T18:47:41.205Z",
    "updatedAt": "2025-09-07T18:47:41.205Z"
  }
}
```

## 4. Booking APIs

### 4.1 Create Immediate Booking

**Endpoint:** `POST /api/bookings`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "instrumentId": "68bdd34d04ba86c528b0e01a",
  "shopId": "68bdd34c04ba86c528b0e018",
  "startDate": "2024-03-25T10:00:00+05:30",
  "endDate": "2024-04-01T10:00:00+05:30",
  "customerDetails": {
    "name": "John Doe",
    "phone": "+919175668567",
    "address": "Phoenix Market City, Pune"
  },
  "shipmentDetails": {
    "type": "standard",
    "vehicle_type_id": 8,
    "pickup_start_time": "2025-09-18T10:00:00+05:30",
    "pickup_end_time": "2025-09-18T18:00:00+05:30"
  },
  "clientSocketId": "socket123"
}
```

### 4.2 Create Scheduled Booking

**Endpoint:** `POST /api/bookings/scheduled`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "instrumentId": "68bdd34d04ba86c528b0e01a",
  "shopId": "68bdd34c04ba86c528b0e018",
  "startDate": "2025-09-20T10:00:00+05:30",
  "endDate": "2025-09-27T10:00:00+05:30",
  "customerDetails": {
    "name": "John Doe",
    "phone": "+919175668567",
    "address": "Phoenix Market City, Pune"
  },
  "shipmentDetails": {
    "type": "standard",
    "vehicle_type_id": 8,
    "pickup_start_time": "2025-09-20T10:00:00+05:30",
    "pickup_end_time": "2025-09-20T18:00:00+05:30"
  }
}
```

## 5. Payment APIs

### 5.1 Create Payment Order

**Endpoint:** `POST /api/razorpay/create-order`

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "vendorAccountId": "acc_RIE7tsq66eZWC3",
  "depositAmount": 300,
  "platformFee": 100
}
```

**Expected Response:**
```json
{
  "success": true,
  "order_id": "order_MkL6TuF7j1bVQ9",
  "total_amount": 100000,
  "deposit": 30000,
  "platform_fee": 10000,
  "rental_owner_share": 60000,
  "key_id": "rzp_test_w5JPLQL0wD4t6c"
}
```

## 6. Delivery Tracking APIs

### 6.1 Calculate Delivery Price

**Endpoint:** `POST /api/borzo/calculatePrice`

**Request Body:**
```json
{
  "type": "standard",
  "matter": "Musical instrument delivery - Drum-set",
  "vehicle_type_id": 8,
  "total_weight_kg": 15,
  "points": [
    {
      "address": "Kumar Pacific Mall, Pune",
      "contact_person": {
        "phone": "+919175668567",
        "name": "Shop Owner"
      }
    },
    {
      "address": "Phoenix Market City, Pune",
      "contact_person": {
        "phone": "+918623948904",
        "name": "Customer"
      }
    }
  ]
}
```

## 7. Mock Data for Frontend Testing

### Complete Shop Object
```json
{
  "_id": "68bdd34c04ba86c528b0e018",
  "name": "Test Music Shop",
  "pickup_address": "Kumar Pacific Mall, Pune - 411001",
  "contact": {
    "name": "Shop Owner",
    "phone": "+919175668567",
    "email": "shop@test.com"
  },
  "razorpay": {
    "linked_account_id": "acc_RIE7tsq66eZWC3",
    "status": "activated",
    "route_config": {
      "status": "activated",
      "bank_details_verified": true
    }
  },
  "bank": {
    "account_holder": "Yash Prasad Thipsay",
    "account_number": "7145529540",
    "ifsc": "KKBK0001770"
  }
}
```

### Complete Instrument Object
```json
{
  "_id": "68bdd34d04ba86c528b0e01a",
  "owner_shop_id": "68bdd34c04ba86c528b0e018",
  "type": "Percussion",
  "name": "Drum Set",
  "description": "Professional drum set for rental",
  "price_per_day": 100,
  "images": ["https://example.com/drum1.jpg"],
  "availability_status": "available",
  "shipping_details": {
    "weight_kg": 15,
    "fragile": true,
    "declared_value": 50000
  }
}
```

## 8. WebSocket Events

Connect to the WebSocket server to receive real-time updates:

### Socket Events to Listen For:
- `price_calculated` - Delivery price calculation results
- `order_created` - Borzo order creation confirmation
- `shipment_created` - Shipment tracking details
- `tracking_update` - Real-time delivery status updates
- `status_update` - Booking status changes

### Example Socket Connection:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

socket.on('price_calculated', (data) => {
  console.log('Price calculated:', data);
});

socket.on('tracking_update', (data) => {
  console.log('Tracking update:', data);
});
```

## 9. Testing Flow

1. **Create Shop** → `POST /api/shops`
2. **Link Razorpay Account** → `POST /api/razorpay/admin/link-account`
3. **Update Bank Details** → `POST /api/razorpay/admin/update-bank-details/:account_id`
4. **Add Instruments** → `POST /api/shops/:shopId/instruments`
5. **Create Booking** → `POST /api/bookings`
6. **Create Payment Order** → `POST /api/razorpay/create-order`
7. **Track Delivery** → Listen to WebSocket events

## 10. Error Handling

All APIs return errors in this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors)
- `404` - Resource not found
- `500` - Internal server error

## 11. Environment Setup

Base URL: `http://localhost:5001`

Required headers:
```
Content-Type: application/json
```

For WebSocket connection:
```
ws://localhost:5001
```

# Frontend Integration Guide - Rentals Server API

This guide provides mock data and API integration instructions for frontend developers to build the UI components for the musical instrument rental platform.

## 1. Shop Management APIs

### 1.1 Create a Shop

**Endpoint:** `POST /api/shops`

**Request Body:**
```json
{
  "name": "Test Music Shop",
  "contact": {
    "name": "Shop Owner",
    "phone": "+919175668567",
    "email": "shop@test.com"
  },
  "pickup_address": "Kumar Pacific Mall, Pune - 411001"
}
```

**Expected Response:**
```json
{
  "success": true,
  "shop": {
    "_id": "68bdd34c04ba86c528b0e018",
    "name": "Test Music Shop",
    "contact": {
      "name": "Shop Owner",
      "phone": "+919175668567",
      "email": "shop@test.com"
    },
    "pickup_address": "Kumar Pacific Mall, Pune - 411001",
    "kyc": {
      "verification_status": "pending"
    },
    "borzo": {
      "pickup_locations": []
    },
    "compliance": {
      "documents": []
    },
    "createdAt": "2025-09-07T18:47:40.969Z",
    "updatedAt": "2025-09-07T18:47:40.969Z"
  }
}
```

### 1.2 Get All Shops

**Endpoint:** `GET /api/shops`

**Expected Response:**
```json
[
  {
    "_id": "68bdd34c04ba86c528b0e018",
    "name": "Test Music Shop",
    "contact": {
      "name": "Shop Owner",
      "phone": "+919175668567",
      "email": "shop@test.com"
    },
    "pickup_address": "Kumar Pacific Mall, Pune - 411001",
    "kyc": {
      "verification_status": "pending"
    },
    "razorpay": {
      "linked_account_id": "acc_RIE7tsq66eZWC3",
      "status": "created",
      "route_config": {
        "status": "needs_clarification"
      }
    }
  }
]
```

### 1.3 Get Single Shop

**Endpoint:** `GET /api/shops/:shopId`

**Example:** `GET /api/shops/68bdd34c04ba86c528b0e018`

## 2. Razorpay Integration APIs

### 2.1 Link Shop with Razorpay Account

**Endpoint:** `POST /api/razorpay/admin/link-account`

**Request Body:**
```json
{
  "vendorDetails": {
    "email": "vendor.harmony@example.com",
    "phone": "+919765432109",
    "reference_id": "harmony_music_001",
    "business_name": "Harmony Music Instruments",
    "business_type": "individual",
    "contact_name": "Kavya Nair",
    "profile": {
      "category": "arts_and_entertainment",
      "subcategory": "music",
      "addresses": {
        "operation": {
          "street1": "123 Music Street",
          "street2": "Near City Mall",
          "city": "Pune",
          "state": "Maharashtra",
          "postal_code": "411001",
          "country": "IN"
        }
      }
    }
  },
  "stakeholderDetails": {
    "name": "Kavya Nair",
    "email": "kavya@harmony.com",
    "phone": "+919765432109",
    "addresses": {
      "residential": {
        "street": "456 Residential Lane, Pune",
        "city": "Pune",
        "state": "Maharashtra",
        "postal_code": "411002",
        "country": "IN"
      }
    },
    "kyc": {
      "pan": "ABCDE1234F"
    }
  },
  "shopId": "68bdd34c04ba86c528b0e018"
}
```

**Expected Response:**
```json
{
  "success": true,
  "linkedAccount": {
    "id": "acc_RIE7tsq66eZWC3",
    "type": "route",
    "status": "created",
    "email": "vendor.harmony@example.com",
    "phone": "+919765432109",
    "legal_business_name": "Harmony Music Instruments"
  },
  "stakeholder": {
    "id": "sth_RIE8abc123def",
    "name": "Kavya Nair",
    "email": "kavya@harmony.com"
  },
  "productConfig": {
    "id": "acc_prd_RIE7yHagPvy7Ej",
    "status": "under_review"
  }
}
```

### 2.2 Update Bank Details

**Endpoint:** `POST /api/razorpay/admin/update-bank-details/:account_id`

**Example:** `POST /api/razorpay/admin/update-bank-details/acc_RIE7tsq66eZWC3`

**Request Body:**
```json
{
  "ifsc": "KKBK0001770",
  "account_number": "7145529540",
  "beneficiary_name": "Yash Prasad Thipsay",
  "product_id": "acc_prd_RIE7yHagPvy7Ej",
  "shopId": "68bdd34c04ba86c528b0e018"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Bank details updated and verified successfully",
  "product_config": {
    "id": "acc_prd_RIE7yHagPvy7Ej",
    "activation_status": "activated",
    "bank_details_verified": true
  }
}
```

### 2.3 Check Account Status

**Endpoint:** `GET /api/razorpay/admin/linked-accounts/:account_id/status`

**Expected Response:**
```json
{
  "success": true,
  "account_id": "acc_RIE7tsq66eZWC3",
  "account_status": "activated",
  "route_product_status": "activated",
  "ready_for_transfers": true,
  "business_name": "Harmony Music Instruments",
  "email": "vendor.harmony@example.com",
  "phone": "+919765432109"
}
```

## 3. Instrument Management APIs

### 3.1 Add Instrument to Shop

**Endpoint:** `POST /api/shops/:shopId/instruments`

**Request Body:**
```json
{
  "owner_shop_id": "68bdd34c04ba86c528b0e018",
  "type": "Percussion",
  "name": "Drum Set",
  "description": "Professional drum set for rental",
  "price_per_day": 100,
  "images": ["https://example.com/drum1.jpg", "https://example.com/drum2.jpg"],
  "tags": ["drums", "percussion", "professional"],
  "shipping_details": {
    "weight_kg": 15,
    "length_cm": 120,
    "width_cm": 80,
    "height_cm": 100,
    "fragile": true,
    "declared_value": 50000,
    "hsn_code": "9207"
  },
  "kyc_requirements": {
    "requires_user_kyc": false,
    "acceptable_docs": []
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "instrument": {
    "_id": "68bdd34d04ba86c528b0e01a",
    "owner_shop_id": "68bdd34c04ba86c528b0e018",
    "type": "Percussion",
    "name": "Drum Set",
    "description": "Professional drum set for rental",
    "price_per_day": 100,
    "availability_status": "available",
    "shipping_details": {
      "weight_kg": 15,
      "fragile": true,
      "declared_value": 50000
    },
    "createdAt": "2025-09-07T18:47:41.205Z",
    "updatedAt": "2025-09-07T18:47:41.205Z"
  }
}
```

## 4. Booking Management APIs

### 4.1 Create Immediate Booking (Instant Delivery)

**Use Case:** For rentals starting within 6 hours

**Endpoint:** `POST /api/bookings`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "instrumentId": "68bdd34d04ba86c528b0e01a",
  "shopId": "68bdd34c04ba86c528b0e018",
  "startDate": "2024-03-25T10:00:00+05:30",
  "endDate": "2024-04-01T10:00:00+05:30",
  "customerDetails": {
    "name": "John Doe",
    "phone": "+919175668567",
    "address": "Phoenix Market City, Pune"
  },
  "shipmentDetails": {
    "type": "standard",
    "vehicle_type_id": 8,
    "pickup_start_time": "2025-09-18T10:00:00+05:30",
    "pickup_end_time": "2025-09-18T18:00:00+05:30"
  },
  "clientSocketId": "socket123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "booking": "68bdd495a12b492c533f13f2",
  "message": "Booking created, shipment being arranged"
}
```

**Status Flow for Immediate Booking:**
1. `pending` → Booking created
2. `ready_to_ship` → Shipment arranged with delivery partner
3. `pickup_scheduled` → Pickup time confirmed
4. `in_transit` → Item picked up, on the way
5. `delivered` → Customer received the instrument
6. `return_requested` → Customer initiates return
7. `return_pickup_scheduled` → Return pickup arranged
8. `returned` → Item returned to shop
9. `completed` → Booking completed

### 4.2 Create Scheduled Booking (Future Delivery)

**Use Case:** For rentals starting more than 6 hours in the future

**Endpoint:** `POST /api/bookings/scheduled`

**Request Body:**
```json
{
  "userId": "507f1f77bcf86cd799439012",
  "instrumentId": "68bdd34d04ba86c528b0e01a",
  "shopId": "68bdd34c04ba86c528b0e018",
  "startDate": "2025-09-20T10:00:00+05:30",
  "endDate": "2025-09-27T10:00:00+05:30",
  "customerDetails": {
    "name": "John Doe",
    "phone": "+919175668567",
    "address": "Phoenix Market City, Pune"
  },
  "shipmentDetails": {
    "type": "standard",
    "vehicle_type_id": 8,
    "pickup_start_time": "2025-09-20T10:00:00+05:30",
    "pickup_end_time": "2025-09-20T18:00:00+05:30"
  }
}
```

**Expected Response:**
```json
{
  "success": true,
  "booking": "68bdd495a12b492c533f13f2",
  "message": "Booking scheduled! Delivery will be arranged on 2025-09-20 04:00:00+05:30",
  "rental_start": "2025-09-20 10:00:00+05:30",
  "shipment_creation_time": "2025-09-20 04:00:00+05:30"
}
```

**Status Flow for Scheduled Booking:**
1. `rider_not_assigned` → Booking scheduled, waiting for delivery time
2. `arranging_pickup` → 6 hours before rental start, arranging delivery
3. `ready_to_ship` → Shipment arranged with delivery partner
4. `pickup_scheduled` → Pickup time confirmed
5. `in_transit` → Item picked up, on the way
6. `delivered` → Customer received the instrument
7. *(same return flow as immediate booking)*

### 4.3 Get Booking Details

**Endpoint:** `GET /api/bookings/:bookingId`

**Example:** `GET /api/bookings/68bdd495a12b492c533f13f2`

**Expected Response:**
```json
{
  "_id": "68bdd495a12b492c533f13f2",
  "user_id": "507f1f77bcf86cd799439012",
  "instrument_id": {
    "_id": "68bdd34d04ba86c528b0e01a",
    "name": "Drum Set",
    "type": "Percussion",
    "price_per_day": 100
  },
  "owner_shop_id": {
    "_id": "68bdd34c04ba86c528b0e018",
    "name": "Test Music Shop",
    "pickup_address": "Kumar Pacific Mall, Pune - 411001"
  },
  "rental": {
    "start_date": "2025-09-07T18:53:09.794Z",
    "end_date": "2025-09-14T18:53:09.794Z",
    "days": 7,
    "price_per_day_snapshot": 100,
    "rental_amount": 700
  },
  "status": "ready_to_ship",
  "customer": {
    "name": "Test Customer",
    "phone": "+919175668567",
    "address": "Odela Lohia Jain Group, Bavdhan, Pune - 411046"
  },
  "shipment": {
    "borzo_order_id": "309539",
    "awb": "09539",
    "tracking_status": "available",
    "last_tracked_at": "2025-09-15T20:15:00.158Z"
  }
}
```

### 4.4 Extend Booking

**Endpoint:** `POST /api/bookings/:bookingId/extend`

**Request Body:**
```json
{
  "newEndDate": "2025-09-21T10:00:00+05:30"
}
```

**Expected Response:**
```json
{
  "success": true,
  "booking": {
    "rental": {
      "start_date": "2025-09-20 10:00:00+05:30",
      "end_date": "2025-09-21 10:00:00+05:30",
      "days": 8,
      "rental_amount": 800
    }
  },
  "extension_details": {
    "additional_days": 1,
    "additional_amount": 100,
    "previous_end_date": "2025-09-20 10:00:00+05:30",
    "new_end_date": "2025-09-21 10:00:00+05:30"
  },
  "message": "Booking extended by 1 days. Additional amount: ₹100"
}
```

### 4.5 Create Test Booking

**Endpoint:** `POST /api/bookings/test`

**Request Body:** `{}` (empty)

**Expected Response:** Creates a complete test booking with shop, instrument, and booking data.

## 5. Booking Status Reference

### Status Types and Meanings:

| Status | Description | User Action Required |
|--------|-------------|---------------------|
| `pending` | Booking created, waiting for payment | Complete payment |
| `payment_pending` | Payment initiated but not confirmed | Wait for payment confirmation |
| `paid` | Payment successful | None |
| `approved` | Booking approved by shop | None |
| `rider_not_assigned` | Scheduled booking waiting for delivery time | None |
| `arranging_pickup` | Creating delivery with partner | None |
| `ready_to_ship` | Shipment created, waiting for pickup | None |
| `pickup_scheduled` | Pickup time confirmed | Be available for delivery |
| `in_transit` | Item picked up, on the way | Prepare to receive |
| `delivered` | Item delivered to customer | Enjoy your rental! |
| `return_requested` | Customer wants to return | Schedule return pickup |
| `return_pickup_scheduled` | Return pickup arranged | Be available for pickup |
| `returned` | Item returned to shop | None |
| `completed` | Booking fully completed | None |
| `cancelled` | Booking cancelled | None |
| `shipment_creation_failed` | Delivery arrangement failed | Contact support |

## 6. Payment APIs

### 6.1 Create Payment Order

**Endpoint:** `POST /api/razorpay/create-order`

**Request Body:**
```json
{
  "amount": 1000,
  "currency": "INR",
  "vendorAccountId": "acc_RIE7tsq66eZWC3",
  "depositAmount": 300,
  "platformFee": 100
}
```

**Expected Response:**
```json
{
  "success": true,
  "order_id": "order_MkL6TuF7j1bVQ9",
  "total_amount": 100000,
  "deposit": 30000,
  "platform_fee": 10000,
  "rental_owner_share": 60000,
  "key_id": "rzp_test_w5JPLQL0wD4t6c"
}
```

## 7. Delivery Tracking APIs

### 7.1 Calculate Delivery Price

**Endpoint:** `POST /api/borzo/calculatePrice`

**Request Body:**
```json
{
  "type": "standard",
  "matter": "Musical instrument delivery - Drum-set",
  "vehicle_type_id": 8,
  "total_weight_kg": 15,
  "points": [
    {
      "address": "Kumar Pacific Mall, Pune",
      "contact_person": {
        "phone": "+919175668567",
        "name": "Shop Owner"
      }
    },
    {
      "address": "Phoenix Market City, Pune",
      "contact_person": {
        "phone": "+918623948904",
        "name": "Customer"
      }
    }
  ]
}
```

## 8. WebSocket Events

Connect to the WebSocket server to receive real-time updates:

### Socket Events to Listen For:
- `price_calculated` - Delivery price calculation results
- `order_created` - Borzo order creation confirmation
- `shipment_created` - Shipment tracking details
- `tracking_update` - Real-time delivery status updates
- `status_update` - Booking status changes

### Example Socket Connection:
```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:5001');

socket.on('price_calculated', (data) => {
  console.log('Price calculated:', data);
});

socket.on('tracking_update', (data) => {
  console.log('Tracking update:', data);
  // data.bookingId, data.status, data.rawStatus
});

socket.on('status_update', (data) => {
  console.log('Status update:', data);
  // data.bookingId, data.status, data.message
});

socket.on('shipment_created', (data) => {
  console.log('Shipment created:', data);
  // data.bookingId, data.shipment
});
```

## 9. Mock Data for Frontend Testing

### Complete Booking Object
```json
{
  "_id": "68bdd495a12b492c533f13f2",
  "user_id": "507f1f77bcf86cd799439012",
  "instrument_id": "68bdd34d04ba86c528b0e01a",
  "owner_shop_id": "68bdd34c04ba86c528b0e018",
  "rental": {
    "start_date": "2025-09-07T18:53:09.794Z",
    "end_date": "2025-09-14T18:53:09.794Z",
    "days": 7,
    "price_per_day_snapshot": 100,
    "rental_amount": 700
  },
  "deposit": {
    "status": "held"
  },
  "status": "ready_to_ship",
  "shop": {
    "pickup_address": "Music Lovers, Tilak Road, Pune - 411001",
    "contact_person": {
      "name": "Shop Owner",
      "phone": "+919175668567"
    }
  },
  "customer": {
    "name": "Test Customer",
    "phone": "+919175668567",
    "address": "Odela Lohia Jain Group, Bavdhan, Pune - 411046"
  },
  "shipment": {
    "borzo_order_id": "309539",
    "awb": "09539",
    "tracking_status": "available",
    "last_tracked_at": "2025-09-15T20:15:00.158Z"
  },
  "createdAt": "2025-09-07T18:53:09.796Z",
  "updatedAt": "2025-09-15T20:15:00.163Z"
}
```

### Complete Shop Object
```json
{
  "_id": "68bdd34c04ba86c528b0e018",
  "name": "Test Music Shop",
  "pickup_address": "Kumar Pacific Mall, Pune - 411001",
  "contact": {
    "name": "Shop Owner",
    "phone": "+919175668567",
    "email": "shop@test.com"
  },
  "razorpay": {
    "linked_account_id": "acc_RIE7tsq66eZWC3",
    "status": "activated",
    "route_config": {
      "status": "activated",
      "bank_details_verified": true
    }
  },
  "bank": {
    "account_holder": "Yash Prasad Thipsay",
    "account_number": "7145529540",
    "ifsc": "KKBK0001770"
  }
}
```

### Complete Instrument Object
```json
{
  "_id": "68bdd34d04ba86c528b0e01a",
  "owner_shop_id": "68bdd34c04ba86c528b0e018",
  "type": "Percussion",
  "name": "Drum Set",
  "description": "Professional drum set for rental",
  "price_per_day": 100,
  "images": ["https://example.com/drum1.jpg"],
  "availability_status": "available",
  "shipping_details": {
    "weight_kg": 15,
    "fragile": true,
    "declared_value": 50000
  }
}
```

## 10. Testing Flow

### For Immediate Booking:
1. **Create Shop** → `POST /api/shops`
2. **Link Razorpay Account** → `POST /api/razorpay/admin/link-account`
3. **Update Bank Details** → `POST /api/razorpay/admin/update-bank-details/:account_id`
4. **Add Instruments** → `POST /api/shops/:shopId/instruments`
5. **Create Immediate Booking** → `POST /api/bookings`
6. **Listen to WebSocket Events** → `shipment_created`, `tracking_update`
7. **Create Payment Order** → `POST /api/razorpay/create-order`
8. **Track Delivery** → Monitor status updates

### For Scheduled Booking:
1. **Follow steps 1-4 above**
2. **Create Scheduled Booking** → `POST /api/bookings/scheduled`
3. **Wait for automated shipment creation** → Status changes to `arranging_pickup`
4. **Follow steps 6-8 above**

## 11. Error Handling

All APIs return errors in this format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors, time constraints)
- `404` - Resource not found (booking, instrument, shop)
- `500` - Internal server error

### Booking-Specific Errors:
- `"Use createBooking for rentals starting within 6 hours"` - Use immediate booking instead
- `"Instrument not found"` - Invalid instrument ID
- `"Shop not found"` - Invalid shop ID
- `"New end date must be after current end date"` - Invalid extension date

## 12. Environment Setup

Base URL: `http://localhost:5001`

Required headers:
```
Content-Type: application/json
```

For WebSocket connection:
```
ws://localhost:5001
```

## 13. Frontend UI Recommendations

### Booking Status Display:
Create a status tracker component showing:
- Current status with icon
- Estimated timeline
- Next expected action
- Contact support option

### Real-time Updates:
- Use WebSocket events to update booking status
- Show notifications for status changes
- Update delivery tracking in real-time

### Date/Time Handling:
- All dates are in IST (Asia/Kolkata timezone)
- Display dates in user-friendly format
- Handle timezone conversions properly for scheduled bookings
