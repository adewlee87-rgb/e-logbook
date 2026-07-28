-- Internship start/end dates, needed to compute dashboard stats
-- (duration status, completion progress, days completed)

alter table profiles
  add column internship_start_date date,
  add column internship_end_date date;
