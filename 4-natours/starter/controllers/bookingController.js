const Stripe = require('stripe');
const { buffer } = require('micro');
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');
const catchAsync = require('../utils/catchAsync');
const factory = require('./handlerFactory');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// Topic: Integrating Stripe into the Back-End
exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently booked tour
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  const product = await stripe.products.create({
    name: `${tour.name} Tour`,
    description: tour.summary,
    images: [
      `${req.protocol}://${req.get('host')}/img/tours/${tour.imageCover}`,
    ],
  });

  const price = await stripe.prices.create({
    product: product.id,
    unit_amount: tour.price * 100,
    currency: 'usd',
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    // Topic: Creating New Bookings on Checkout Success
    // success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
    // Topic: Finishing Payments with Stripe Webhooks
    success_url: `${req.protocol}://${req.get('host')}/my-tours?alert=booking`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
    customer_email: req.user.email,
    client_reference_id: req.params.tourId,
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
  });

  // 3) Create session as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

// Topic: Creating New Bookings on Checkout Success
// exports.createBookingCheckout = catchAsync(async (req, res, next) => {
//   // This is only TEMPORARY, because it's UNSECURE: everyone can make bookings without paying
//   const { tour, user, price } = req.query;

//   if (!tour && !user && !price) return next();
//   await Booking.create({ tour, user, price });

//   res.redirect(req.originalUrl.split('?')[0]);
// });

// Topic: Finishing Payments with Stripe Webhooks
const createBookingCheckout = async (session) => {
  console.log(session.customer_email, 'hello');
  const tour = session.client_reference_id;
  const user = (await User.findOne({ email: session.customer_email }))._id;
  const price = session.line_items[0].price.unit_amount / 100;
  await Booking.create({ tour, user, price });
};

exports.webhookCheckout = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  const reqBuffer = await buffer(req.body);

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      reqBuffer,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed')
    createBookingCheckout(event.data.object);

  res.status(200).json({ received: true });
};

// Topic: Finishing the Bookings API
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.createBooking = factory.createOne(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
