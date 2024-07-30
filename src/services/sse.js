import { EventSourcePolyfill } from 'event-source-polyfill';
import axios from 'axios';
import router from '@/router';

async function refreshToken() {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_APP_API_URL}auth/refresh`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth.refreshToken')}`,
        },
      }
    );
    localStorage.setItem('auth.accessToken', response.data.data.accessToken);
    localStorage.setItem('auth.refreshToken', response.data.data.refreshToken);
    return true;
  } catch (error) {
    console.log('Error refreshing auth token', error);
    localStorage.clear('auth.accessToken');
    router.push({ name: 'login' });
    return false;
  }
}

export function createEventSource(tenant, type) {
  let url;

  if (type === undefined) {
    url = `${import.meta.env.VITE_APP_API_URL}telemetry/access-token/status-device/sse/${tenant}`;
  } else {
    url = `${import.meta.env.VITE_APP_API_URL}telemetry/access-token/status-device/sse/${tenant}?type=${type}`;
  }

  const createNewEventSource = () => {
    const eventSource = new EventSourcePolyfill(url, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('auth.accessToken')}`,
      },
    });

    eventSource.addEventListener('error', async (event) => {
      if (event.status === 401) {
        const tokenRefreshed = await refreshToken();
        if (tokenRefreshed) {
          eventSource.close();
          createNewEventSource();
        }
      }
    });

    return eventSource;
  };

  return createNewEventSource();
}

