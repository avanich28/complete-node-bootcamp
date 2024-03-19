/* eslint-disable */
import axios from 'axios';
// Topic: Logging in Users with Our API - Part 3
import { showAlert } from './alert';

// Topic: Logging in Users with Our API - Part 1

export const login = async (email, password) => {
  console.log(email, password);
  try {
    // axios returns promise
    const res = await axios({
      method: 'POST',
      url: 'http://127.0.0.1:8000/api/v1/users/login',
      data: {
        email,
        password,
      },
    });

    // Topic: Logging in Users with Our API - Part 2
    if (res.data.status === 'success') {
      showAlert('success', 'Logged in successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};

// Topic: Logging out Users
export const logout = async () => {
  try {
    console.log('hello logout');
    const res = await axios({
      method: 'GET',
      url: 'http://127.0.0.1:8000/api/v1/users/logout',
    });

    if (res.data.status === 'success') location.reload(true);
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again.');
  }
};
