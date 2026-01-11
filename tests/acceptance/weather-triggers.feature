Feature: Weather-Triggered Compliance Automation
  As a construction site supervisor
  I want automatic alerts when rain is forecasted
  So that I can deploy controls before violations occur

  Background:
    Given a site with id "site-001" in Virginia
    And the site has a CGP permit with 0.5 inch per hour threshold

  Scenario: Rain threshold triggers SMS alert to superintendent
    Given NOAA forecasts 0.6 inches rainfall in 4 hours
    When the weather trigger service evaluates the forecast
    Then an SMS alert should be queued for the superintendent
    And the alert message should contain "Rain alert: Deploy controls"
    And the alert priority should be "high"

  Scenario: Rain below threshold does not trigger alert
    Given NOAA forecasts 0.3 inches rainfall in 4 hours
    When the weather trigger service evaluates the forecast
    Then no alerts should be generated

  Scenario: Post-storm inspection window is calculated correctly
    Given a rainfall event of 0.8 inches occurred
    And the jurisdiction requires 24-hour post-storm inspection
    When the inspection window is calculated
    Then the inspection deadline should be 24 hours from storm end
    And an inspection reminder should be scheduled

  Scenario: Multi-channel alert delivery
    Given NOAA forecasts 1.0 inch rainfall in 2 hours
    When the weather trigger service evaluates the forecast
    Then alerts should be queued for the following channels:
      | channel | recipient          |
      | SMS     | superintendent     |
      | push    | site inspectors    |
      | email   | project owner      |

  Scenario: Weather data caching for offline mode
    Given weather data was cached 6 hours ago
    When the NOAA API is unavailable
    Then the system should use cached weather data
    And a warning should indicate "Using cached data (6h old)"
