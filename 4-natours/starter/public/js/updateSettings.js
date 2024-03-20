/* eslint-disable */
import { showAlert } from './alert';
import axios from 'axios';

// Topic: Updating User Data with Our API
// Topic: Updating User Password with Our API
// type is either 'password' or 'data'
export const updateSettings = async (data, type) => {
  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe';

    const res = await axios({
      method: 'PATCH',
      url,
      data,
    });

    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} updated successfully!`);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
