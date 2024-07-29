// src/utils/createEventSource.js
import {EventSourcePolyfill}  from 'event-source-polyfill';

export function createEventSource(tenant,type) {
  let url 

  if (type === undefined) {
    url = `${import.meta.env.VITE_APP_API_URL}telemetry/access-token/status-device/sse/${tenant}`
  } else {
    url = `${import.meta.env.VITE_APP_API_URL}telemetry/access-token/status-device/sse/${tenant}?type=${type}`
  }
  const eventSource = new EventSourcePolyfill(url, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('auth.accessToken')}`
    }
  })
  return eventSource
}
