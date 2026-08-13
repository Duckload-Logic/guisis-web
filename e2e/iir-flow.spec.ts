import { test, expect } from "@playwright/test";

test.describe("IIR Flow & Routing E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept auth session call
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

    // Mock profile fetch globally
    await page.route(
      "**/api/v1/students/inventory/records/iir/*/profile",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            data: {
              id: "iir-123",
              isCompleted: false,
              isSubmitted: true,
            },
          }),
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

    // Mock notification endpoints to prevent unauthorized redirect
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

  test("Expedited IIR user sees warning banner and tab limits", async ({
    page,
  }) => {
    // Mock user having an expedited (submitted but not completed) IIR
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
              isSubmitted: true,
              isCompleted: false,
            },
          }),
        });
      }
    );

    // Go to student index (dashboard)
    await page.goto("/student");

    // Check warning banner
    const banner = page.locator("text=Complete Form");
    await expect(banner).toBeVisible();

    // Go to profile tab and check restrictions
    await page.goto("/student/iir");

    // "II. Educational Background" tab should be disabled
    const eduTab = page.locator("button:has-text('Educational Background')");
    await expect(eduTab).toBeDisabled();
  });

  test("Complete Form bypass button works", async ({ page }) => {
    // Mock user having an expedited (submitted but not completed) IIR
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
              isSubmitted: true,
              isCompleted: false,
            },
          }),
        });
      }
    );

    await page.goto("/student");
    const completeBtn = page.locator("button:has-text('Complete Form')");
    await expect(completeBtn).toBeVisible();
    await completeBtn.click();

    // Verify redirect to whole IIR form URL
    await expect(page).toHaveURL(/.*\/student\/iir\/form/);
  });

  test("Expedited IIR loads saved profile progress", async ({ page }) => {
    // Mock user having an expedited IIR
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
              isSubmitted: true,
              isCompleted: false,
            },
          }),
        });
      }
    );

    // Mock profile fetch with saved student data
    await page.route(
      "**/api/v1/students/inventory/records/iir/*/profile",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            status: "success",
            data: {
              id: "iir-123",
              isCompleted: false,
              isSubmitted: true,
              student: {
                personalInfo: {
                  dateOfBirth: "2000-01-01",
                  sex: { id: 1, name: "Male" },
                  civilStatus: { id: 1, name: "Single" },
                  citizenship: "Filipino",
                  contactNumber: "09123456789",
                  twoByTwoPhotoDataUrl: "data:image/png;base64,mock",
                },
              },
            },
          }),
        });
      }
    );

    await page.goto("/student/iir/form");

    // The Form Progress pill should reflect saved progress (greater than 0%)
    const progressPill = page.locator("text=% Form Progress");
    await expect(progressPill).toBeVisible();
    await expect(progressPill).not.toHaveText("0% Form Progress");
  });
});
