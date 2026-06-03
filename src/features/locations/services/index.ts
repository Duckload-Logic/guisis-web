/**
 * Location Service Layer
 * Handles all location-related API calls (regions, cities, barangays)
 */

import { apiClient, AxiosConfigWithMeta } from "@/lib/api";
import { API_ROUTES } from "@/config/apiRoutes";

/**
 * Get all regions
 * @param config - Axios config with logging metadata
 * @returns Array of regions
 */
export async function GetRegions(config?: AxiosConfigWithMeta) {
  try {
    const response = await apiClient.get(API_ROUTES.locations.regions, config);
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get province by region
 * @param regionCode - Region Code
 * @returns Array of provinces
 */
export async function GetProvinces(
  regionCode: string,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(
      API_ROUTES.locations.provinces(regionCode),
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get cities by region
 * @param regionCode - Region Code - optional to fetch all cities with no provinces
 * @param provinceCode - Province Code
 * @param config - Axios config with logging metadata
 * @returns Array of cities
 */
export async function GetCities(
  regionCode?: string,
  provinceCode?: string,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(
      (provinceCode
        ? API_ROUTES.locations.citiesByProvince(provinceCode)
        : // Type assertion for API_ROUTES return type
          API_ROUTES.locations.citiesByRegion(regionCode || "")) as string,
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Get barangays by city
 * @param cityCode - City Code
 * @param config - Axios config with logging metadata
 * @returns Array of barangays
 */
export async function GetBarangays(
  cityCode: string,
  config?: AxiosConfigWithMeta,
) {
  try {
    const response = await apiClient.get(
      API_ROUTES.locations.barangays(cityCode),
      config,
    );
    return response.data;
  } catch (error: any) {

    throw error;
  }
}

/**
 * Legacy service object for backward compatibility
 * Gradually migrate to direct function imports
 */
export const locationService = {
  GetRegions,
  GetCities,
  GetBarangays,
};
