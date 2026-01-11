Feature: Digital Inspection Checklists
  As a site inspector
  I want GPS-tagged digital checklists
  So that I can complete and submit inspections efficiently

  Background:
    Given I am an authenticated inspector
    And I am at site "site-001"

  Scenario: Load Virginia DEQ checklist template
    Given the site is subject to Virginia DEQ CGP requirements
    When I start a new inspection
    Then the checklist should load the Virginia DEQ template
    And the checklist should include all required BMP categories

  Scenario: GPS tagging of inspection points
    Given I am at inspection point with coordinates 37.5407, -77.4360
    When I complete a checklist item
    Then the item should be tagged with my GPS coordinates
    And the location accuracy should be recorded

  Scenario: Offline inspection completion
    Given I have no network connectivity
    When I complete inspection items
    Then all data should be stored locally
    And items should sync when connectivity is restored

  Scenario: Photo attachment to checklist item
    Given I am inspecting a silt fence
    When I attach a photo to the checklist item
    Then the photo should be linked to the GPS location
    And the photo should be queued for AI analysis

  Scenario: Generate PDF inspection report
    Given I have completed all checklist items
    When I generate the inspection report
    Then a PDF should be created with:
      | element            |
      | inspector name     |
      | certification ID   |
      | timestamps         |
      | GPS coordinates    |
      | annotated photos   |
      | weather conditions |

  Scenario: Chain of custody metadata
    When I submit an inspection
    Then the record should include:
      | metadata           |
      | inspector ID       |
      | certification exp  |
      | device ID          |
      | submission time    |
      | GPS coordinates    |
