// frontend/src/components/XeroCallback.jsx
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function XeroCallback() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleXeroCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const state = params.get('state');
        const error = params.get('error');
        const errorDescription = params.get('error_description');

        console.log('Callback params:', { code, state, error, errorDescription });

        // Check for OAuth errors first
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setError(`OAuth error: ${error} - ${errorDescription || 'Unknown error'}`);
          setTimeout(() => navigate('/login?error=oauth_error'), 2000);
          return;
        }

        // Validate required parameters
        if (!code) {
          console.error('No authorization code received');
          setError('No authorization code received from Xero');
          setTimeout(() => navigate('/login?error=no_code'), 2000);
          return;
        }

        // Note: Remove state validation if you're not setting it properly in your OAuth flow
        // The state should match what you sent in the initial authorization request
        if (!state) {
          console.warn('No state parameter received - this might be a security issue');
        }

        // Remove Option 1: Try backend proxy first (recommended)
        // Only perform direct token exchange with Xero

        // Xero OAuth credentials
        const client_id = `${import.meta.env.VITE_XERO_CLIENT_ID}`;
        const client_secret = `${import.meta.env.VITE_XERO_CLIENT_SECRET}`;

        // Try different possible redirect URIs that might have been used initially
        const possibleRedirectUris = [`${import.meta.env.VITE_XERO_CALLBACK_URL}`];

        let response;
        let tokenExchangeSuccessful = false;

        // Option 2: Direct token exchange with multiple redirect URI attempts
        for (let i = 0; i < possibleRedirectUris.length; i++) {
          const redirect_uri = possibleRedirectUris[i];

          try {
            console.log(`Trying token exchange with redirect_uri: ${redirect_uri}`);

            // Create form data for token exchange
            const tokenData = {
              grant_type: 'authorization_code',
              code: code,
              redirect_uri: redirect_uri,
            };

            // Convert object to URL-encoded string
            const formData = new URLSearchParams(tokenData).toString();

            const basicAuth = btoa(`${client_id}:${client_secret}`);

            console.log('Token exchange data:', formData);

            // Send the form-encoded string as body
            response = await axios.post('https://identity.xero.com/connect/token', formData, {
              headers: {
                Authorization: `Basic ${basicAuth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
                Accept: 'application/json',
              },
              timeout: 10000,
            });

            tokenExchangeSuccessful = true;
            console.log(`Token exchange successful with redirect_uri: ${redirect_uri}`);
            window.location.href = '/';
            break; // Exit loop on success

          } catch (attemptError) {
            console.log(`Failed with redirect_uri ${redirect_uri}:`, attemptError.response?.data || attemptError.message);

            // If this is the last attempt, throw the error
            if (i === possibleRedirectUris.length - 1) {
              throw attemptError;
            }
          }
        }

        if (!tokenExchangeSuccessful) {
          throw new Error('All token exchange attempts failed');
        }

        console.log('Token exchange successful:', response.data);

        // Store tokens
        const { access_token, refresh_token, id_token, expires_in, token_type } = response.data;

        if (!access_token) {
          throw new Error('No access token received from Xero');
        }

        // Store tokens in localStorage
        localStorage.setItem('token', access_token);
        if (refresh_token) {
          localStorage.setItem('xero_refresh_token', refresh_token);
        }
        if (id_token) {
          localStorage.setItem('xero_id_token', id_token);
        }

        // Store token expiry
        if (expires_in) {
          const expiryTime = Date.now() + (expires_in * 1000);
          localStorage.setItem('xero_token_expiry', expiryTime.toString());
        }

        // Optional: Decode and store user info from id_token
        if (id_token) {
          try {
            // Simple JWT decode (without verification - for display purposes only)
            const base64Url = id_token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const userInfo = JSON.parse(jsonPayload);
            console.log('User info from id_token:', userInfo);
            localStorage.setItem('xero_user_info', JSON.stringify(userInfo));
          } catch (decodeError) {
            console.warn('Failed to decode id_token:', decodeError);
          }
        }

        console.log('Tokens stored successfully, redirecting to chat interface...');

        // Redirect to chat interface
        navigate('/');
        return;

      } catch (error) {
        console.error('Token exchange error:', error);

        let errorMessage = 'Token exchange failed';

        if (error.response) {
          // Server responded with error status
          console.error('Error response:', error.response.data);
          console.error('Error status:', error.response.status);

          if (error.response.data && error.response.data.error) {
            errorMessage = `${error.response.data.error}: ${error.response.data.error_description || 'Unknown error'}`;
          } else if (error.response.status === 400) {
            errorMessage = 'Bad Request - Check your client credentials and redirect URI';
          } else if (error.response.status === 401) {
            errorMessage = 'Unauthorized - Invalid client credentials';
          }
        } else if (error.request) {
          // Network error
          errorMessage = 'Network error - Could not reach Xero token endpoint';
        } else {
          // Other error
          errorMessage = error.message || 'Unknown error occurred';
        }

        setError(errorMessage);

        // Redirect to login with error after showing message
        setTimeout(() => {
          navigate('/login?error=token_exchange_failed');
        }, 3000);
      } finally {
        setLoading(false);
      }
    };

    handleXeroCallback();
  }, [navigate]);

  // Render loading or error state
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '20px'
      }}>
        <div>Processing Xero login...</div>
        <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
          Please wait while we complete your authentication.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '200px',
        padding: '20px',
        color: '#d32f2f'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>Authentication Error</div>
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>{error}</div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Redirecting to login page...
        </div>
      </div>
    );
  }

  return null;
}
