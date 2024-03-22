/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';
const stripe = Stripe(
  'pk_test_51OuuXk01rGGIh85XogHGwXOBC2LyM4SeLICR1oCspzknsM4vVlO7mJL9Z9w7giVknQSvyBjPqi4F0dnBlqTl9oR500l6uemeJ7',
);

// Topic: Processing Payments on the Front-End
export const bookTour = async (tourId) => {
  try {
    // 1) Get checkout session from API
    const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`);
    console.log(session);

    // 2) Create checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
