Feature: AI-Powered Photo Inspection
  As a site inspector
  I want to capture BMP photos and get instant defect detection
  So that I can document violations accurately

  Background:
    Given the AI vision model is initialized
    And the minimum confidence threshold is 0.85

  Scenario: Detect silt fence tear
    Given I have a photo of a damaged silt fence with a visible tear
    When the AI analyzes the photo
    Then the result should contain a defect of class "silt_fence_tear"
    And the confidence score should be greater than 0.85
    And a bounding box should be provided for the defect

  Scenario: Detect clogged inlet protection
    Given I have a photo of an inlet with accumulated sediment
    When the AI analyzes the photo
    Then the result should contain a defect of class "inlet_clogged"
    And the severity should be "high"

  Scenario: Detect sediment tracking
    Given I have a photo showing mud tracks leaving the site
    And the tracks extend more than 50 feet
    When the AI analyzes the photo
    Then the result should contain a defect of class "sediment_tracking"
    And the recommended action should be "Deploy wheel wash or sweep access road"

  Scenario: No defects detected in compliant BMP
    Given I have a photo of a properly installed silt fence
    When the AI analyzes the photo
    Then no defects should be detected
    And the result should indicate "BMP compliant"

  Scenario: Multiple defects in single photo
    Given I have a photo showing a torn silt fence and gap in perimeter control
    When the AI analyzes the photo
    Then the result should contain 2 defects
    And the defects should include "silt_fence_tear" and "perimeter_gap"

  Scenario: Low confidence result triggers manual review
    Given I have a photo with poor lighting conditions
    When the AI analyzes the photo
    And the confidence score is below 0.70
    Then the result should be flagged for "manual_review"
    And the reason should be "Low confidence detection"

  Scenario: GPS tagging of inspection photo
    Given I capture a photo at coordinates 37.5407, -77.4360
    When the photo is submitted for analysis
    Then the inspection record should include GPS coordinates
    And location accuracy should be within 5 meters
