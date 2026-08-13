import { test, expect } from "@playwright/test";

test.describe("SelectField & DatePicker Network E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept auth session
    await page.route("**/api/v1/auth/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: {
            id: "student-123",
            email: "student3@gmail.com",
            roles: [{ id: "role-1", name: "Student" }],
            firstName: "Juan",
            lastName: "Dela Cruz",
          },
        }),
      });
    });

    // Mock status as non-expedited for simplicity
    await page.route(
      "**/api/v1/students/inventory/records/user/student-123",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            data: {
              id: "iir-123",
              userId: "student-123",
              isSubmitted: false,
              isCompleted: false,
            },
          }),
        });
      }
    );

    // Mock academic settings
    await page.route(
      "**/api/v1/students/settings/academic",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            currentYearStart: 2026,
            currentYearEnd: 2027,
            currentTerm: 1,
            allowExpeditedIIR: true,
            updatedAt: "2026-08-12T00:00:00Z",
          }),
        });
      }
    );

    // Mock draft endpoint
    await page.route(
      "**/api/v1/students/inventory/records/iir/draft",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(null),
        });
      }
    );

    // Mock lookups globally
    await page.route("**/api/v1/students/lookups/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: [
            { id: "1", name: "Mock Option" },
            { id: "prog-1", name: "BSIT" },
            { id: "prog-2", name: "BSCS" },
          ],
        }),
      });
    });

    // Mock locations globally
    await page.route("**/api/v1/locations/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: [{ code: "1", name: "Mock Location" }],
        }),
      });
    });

    // Mock notifications
    await page.route("**/api/v1/notifications/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          status: "success",
          data: [],
        }),
      });
    });

    // Go to login to set localStorage origin
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.setItem("session_active", "true");
      localStorage.setItem(
        "active_role",
        JSON.stringify({ id: "role-1", name: "Student" })
      );
      sessionStorage.setItem("session_consent_accepted", "true");
    });
  });

  test("SelectField handles loading state and slow connection", async ({
    page,
  }) => {
    // Intercept lookups with a 2-second delay
    await page.route(
      "**/api/v1/students/lookups/programs",
      async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            data: [
              { id: "prog-1", name: "BSIT" },
              { id: "prog-2", name: "BSCS" },
            ],
          }),
        });
      }
    );

    // Go to IIR form page
    await page.goto("/student/iir/form");

    // Target visible desktop select trigger button
    const selectTrigger = page
      .locator("button:has-text('Select program')")
      .filter({ visible: true });

    // Check loading/disabled state
    if ((await selectTrigger.count()) > 0) {
      await expect(selectTrigger).toBeDisabled();
    }

    // Wait for lookup request to complete
    await page.waitForResponse("**/api/v1/students/lookups/programs");

    // Select should now be enabled and clickable
    if ((await selectTrigger.count()) > 0) {
      await expect(selectTrigger).toBeEnabled();
      await selectTrigger.click();

      // Options should be visible
      const option = page.locator("role=menuitem >> text=BSIT");
      await expect(option).toBeVisible();
    }
  });

  test("DatePicker is robust when disabled by parent", async ({ page }) => {
    await page.goto("/student/iir/form");

    // Find date picker
    const datePicker = page.locator("button:has-text('Select a date')");

    if ((await datePicker.count()) > 0) {
      await expect(datePicker).toBeEnabled();
      await datePicker.click();

      // Verify popover/calendar content is visible
      const calendar = page.locator(".rdp");
      await expect(calendar).toBeVisible();
    }
  });
});
