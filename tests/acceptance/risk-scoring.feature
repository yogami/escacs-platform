Feature: Violation Risk Scoring
  As a project manager
  I want to see violation risk scores for my sites
  So that I can prioritize preventive actions

  Background:
    Given a construction site with id "site-001"
    And the site is in the "grading" phase

  Scenario: High risk score from combined factors
    Given site conditions:
      | factor              | value     |
      | slope_percent       | 15        |
      | soil_type           | sandy     |
      | days_since_inspect  | 5         |
    And weather forecast shows 1.2 inches rain in 24 hours
    When I calculate the risk score
    Then the score should be greater than 75
    And the risk level should be "critical"
    And the top preventive action should be "Deploy additional inlet protection"

  Scenario: Moderate risk from weather alone
    Given site conditions:
      | factor              | value     |
      | slope_percent       | 5         |
      | soil_type           | clay      |
      | days_since_inspect  | 1         |
    And weather forecast shows 0.8 inches rain in 48 hours
    When I calculate the risk score
    Then the score should be between 40 and 60
    And the risk level should be "moderate"

  Scenario: Low risk with good conditions
    Given site conditions:
      | factor              | value     |
      | slope_percent       | 2         |
      | soil_type           | clay      |
      | days_since_inspect  | 0         |
    And weather forecast shows no precipitation
    When I calculate the risk score
    Then the score should be less than 25
    And the risk level should be "low"

  Scenario: Historical violations increase risk
    Given the contractor has 3 NOVs in the past 12 months
    And site conditions are otherwise moderate
    When I calculate the risk score
    Then the score should be increased by at least 15 points
    And the risk factors should include "historical_violations"

  Scenario: Risk score provides actionable recommendations
    When I calculate the risk score
    Then the result should include exactly 3 preventive actions
    And each action should have a priority rank
    And each action should be achievable within 24 hours

  Scenario: 72-hour risk forecast
    Given current site conditions
    When I request a 72-hour risk forecast
    Then I should receive risk scores for 24, 48, and 72 hour horizons
    And each horizon should have its own preventive actions
