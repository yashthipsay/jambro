const mongoose = require('mongoose');


const subscriptionSchema = new mongoose.Schema({
    // subscriptionId
    // userId
    // skuId
    // status
    // startDate
    // endDate
    // autoRenew
    // createdAt
    // updatedAt

});

const skuSchema = new mongoose.Schema({
    // skuId
    // name
    // description
    // price
    // duration
    // no of hours
    // this is a part where you can select either of both options: JamRoom only of recording studio only, or both
    // createdAt
    // updatedAt
});

const skuPaymentSchema = new mongoose.Schema({
    // skuPaymentId
    // subscriptionId
    // userId
    // amount
    // paymentDate
    // paymentType: one time or recurring
    // status
    // razorpayPaymentId
    // createdAt
});
