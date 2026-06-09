/**
 * IDPLoginButton Component
 * Initiates OAuth 2.0 Authorization Code flow with IDP
 */

import { useState } from "react";
import { API_ROUTES } from "@/config/apiRoutes";
import { IDP_BUTTON_TEXT } from "../types/idp";

/**
 * Props for IDPLoginButton component
 */
export interface IDPLoginButtonProps {
  /**
   * Optional callback when an error occurs
   * @param error - Error message to display
   */
  onError?: (error: string) => void;

  /**
   * Optional CSS class name for styling
   */
  className?: string;

  /**
   * Optional flag to disable the button
   */
  disabled?: boolean;

  onClick?: () => void;
}

/**
 * Button component that initiates IDP OAuth 2.0 login flow
 * Fetches authorization URL and redirects user to IDP
 *
 * @param props - Component props
 * @returns JSX element
 */
export const IDPLoginButton: React.FC<IDPLoginButtonProps> = ({ 
  onError,
  className = "",
  disabled = false,
  onClick,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Handles button click to initiate OAuth flow
   * Fetches authorization URL and redirects to IDP
   */
  const handleLogin = () => {
    setIsLoading(true);
    if (onClick) onClick();

    // Get API Base URL from environment
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

    // Navigate directly to backend authorization endpoint
    // Preserve the login page in history so back navigation
    // returns to the landing page instead of the previous route.
    window.location.assign(`${apiBaseUrl}${API_ROUTES.auth.idpAuthorizeUrl}`);
  };

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={disabled || isLoading}
      className={className}
      aria-busy={isLoading}
      aria-label={isLoading ? IDP_BUTTON_TEXT.LOADING : IDP_BUTTON_TEXT.LOGIN}
    >
      {isLoading ? IDP_BUTTON_TEXT.LOADING : IDP_BUTTON_TEXT.LOGIN}
    </button>
  );
};
