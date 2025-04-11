const Razorpay = require("razorpay");
require("dotenv").config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_API_KEY,
  key_secret: process.env.RAZORPAY_API_SECRET,
});

// Helper function to add delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const verifyBankAccount = async (req, res) => {
  try {
    const { name, email, contact, upiAddress } = req.body;

    // Step 1: Create contact using the endpoint directly
    const contactResponse = await fetch(
      "https://api.razorpay.com/v1/contacts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_API_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          name,
          email,
          contact,
          type: "employee",
          reference_id: "Acme Contact ID 12345",
          notes: {
            notes_key_1: "Tea, Earl Grey, Hot",
            notes_key_2: "Tea, Earl Grey... decaf.",
          },
        }),
      }
    );

    const contactResult = await contactResponse.json();

    if (contactResponse.status !== 200) {
      return res.status(400).json({
        success: false,
        error: contactResult.error.description,
      });
    }

    const contactId = contactResult.id;

    // Add delay before creating fund account
    await delay(2000);

    // Step 2: Create fund account of type VPA using the endpoint directly
    const fundAccountResponse = await fetch(
      "https://api.razorpay.com/v1/fund_accounts",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_API_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          account_type: "vpa",
          contact_id: contactId,
          vpa: {
            address: upiAddress,
          },
        }),
      }
    );

    const fundAccountResult = await fundAccountResponse.json();

    if (fundAccountResponse.status !== 200) {
      return res.status(400).json({
        success: false,
        error: fundAccountResult.error.description,
      });
    }

    const fundAccountId = fundAccountResult.id;
    console.log(fundAccountId);

    // Add delay before validation
    await delay(2000);

    // Step 3: Validate the bank account using the endpoint directly
    const validationResponse = await fetch(
      "https://api.razorpay.com/v1/fund_accounts/validations",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(
            `${process.env.RAZORPAY_API_KEY}:${process.env.RAZORPAY_API_SECRET}`
          ).toString("base64")}`,
        },
        body: JSON.stringify({
          account_number: process.env.RAZORPAY_SOURCE_ACCOUNT,
          fund_account: {
            id: fundAccountId,
          },
          notes: {
            random_key_1: "Make it so.",
            random_key_2: "Tea. Earl Grey. Hot.",
          },
        }),
      }
    );
    const validationResult = await validationResponse.json();

    if (validationResponse.status === 200) {
      return res.status(200).json({
        success: true,
        validation: validationResult,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: validationResult.error.description,
      });
    }
  } catch (err) {
    console.error(
      `Fund account creation error: ${JSON.stringify(err, null, 2)}`
    );
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error",
    });
  }
};

module.exports = { verifyBankAccount };

// curl -u rzp_test_k01A3e2spO0LXo:ra99wVBdMdnPF7XtsKKrB9UD\
// -X POST https://api.razorpay.com/v1/contacts \
// -H "Content-Type: application/json" \
// -d '{
//   "name":"Gaurav Kumar",
//   "email":"gaurav.kumar@example.com",
//   "contact":"9000090000",
//   "type":"employee",
//   "reference_id":"Acme Contact ID 12345",
//   "notes":{
//     "notes_key_1":"Tea, Earl Grey, Hot",
//     "notes_key_2":"Tea, Earl Grey… decaf."
//   }
// }'
