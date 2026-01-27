
ALTER TABLE persons 
ADD COLUMN is_deceased boolean DEFAULT false,
ADD COLUMN date_of_death date;
