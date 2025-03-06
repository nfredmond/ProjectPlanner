-- Add default California Transportation Commission scoring criteria
INSERT INTO criteria (agency_id, name, description, max_points, weight, "order", is_default, created_at, updated_at)
VALUES
  (NULL, 'Safety Improvements', 'Evaluates how the project improves safety for all road users, reduces accidents, and addresses high-risk areas.', 5, 20.0, 10, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Congestion Relief', 'Measures how effectively the project reduces traffic congestion, improves travel times, and increases throughput.', 5, 15.0, 20, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'State of Good Repair', 'Assesses how the project maintains or improves existing transportation infrastructure and extends its useful life.', 5, 15.0, 30, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Equity Impact', 'Evaluates how the project benefits disadvantaged communities and improves transportation access for underserved populations.', 5, 15.0, 40, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Environmental Sustainability', 'Measures the project''s contribution to reducing emissions, protecting natural resources, and promoting sustainable transportation modes.', 5, 15.0, 50, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Regional Plan Consistency', 'Assesses how well the project aligns with regional transportation plans and supports long-term planning goals.', 5, 10.0, 60, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'VMT Reduction', 'Evaluates how the project reduces vehicle miles traveled and promotes alternative transportation modes.', 5, 10.0, 70, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Bike/Pedestrian Improvements', 'Measures how the project enhances infrastructure for non-motorized transportation and improves connectivity.', 5, 10.0, 80, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Zero-Emission Infrastructure', 'Assesses the project''s contribution to supporting zero-emission vehicles and related infrastructure.', 5, 10.0, 90, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Freight Movement', 'Evaluates how the project improves freight mobility, reduces bottlenecks, and supports goods movement.', 5, 10.0, 100, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Climate Resilience', 'Measures how the project addresses climate change impacts and improves system resilience to extreme weather events.', 5, 10.0, 110, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  (NULL, 'Public Engagement', 'Assesses the level of community involvement and support for the project.', 5, 10.0, 120, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Create a function to automatically copy default criteria to new agencies
CREATE OR REPLACE FUNCTION copy_default_criteria_to_agency()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO criteria (
    agency_id, name, description, max_points, weight, "order", is_default, created_at, updated_at
  )
  SELECT 
    NEW.id, name, description, max_points, weight, "order", FALSE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
  FROM criteria
  WHERE is_default = TRUE AND agency_id IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to add default criteria when a new agency is created
CREATE TRIGGER add_default_criteria_to_new_agency
AFTER INSERT ON agencies
FOR EACH ROW EXECUTE FUNCTION copy_default_criteria_to_agency(); 