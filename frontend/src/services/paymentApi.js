import axiosInstance from '../utils/axios';

/**
 * paymentApi - Stub for Cashfree / Razorpay payment integration.
 * In the original multi-tenant app these endpoints integrate with a payment gateway.
 * Here we return a no-op since subscription enforcement is disabled.
 */

export const createPayPerUseOrder = async (featureType) => {
  // Stub - actual payment not implemented in this version
  // Replace with real payment gateway call if needed
  try {
    const res = await axiosInstance.post('/payments/pay-per-use', { featureType });
    return res.data;
  } catch (err) {
    console.error('Payment not available:', err.message);
    return { status: 'error', message: 'Payment gateway not configured' };
  }
};

export const verifyPayment = async (orderId, paymentId, signature) => {
  try {
    const res = await axiosInstance.post('/payments/verify', { orderId, paymentId, signature });
    return res.data;
  } catch (err) {
    console.error('Payment verification failed:', err.message);
    return { status: 'error', message: 'Payment verification failed' };
  }
};
