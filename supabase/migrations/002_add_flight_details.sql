-- Migration: Add detailed flight information columns
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- Add airport name columns
ALTER TABLE flights ADD COLUMN IF NOT EXISTS departure_airport_name text;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS arrival_airport_name text;

-- Add country code columns
ALTER TABLE flights ADD COLUMN IF NOT EXISTS departure_country text;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS arrival_country text;

-- Add actual time columns (revised departure / predicted arrival)
ALTER TABLE flights ADD COLUMN IF NOT EXISTS departure_time_actual timestamptz;
ALTER TABLE flights ADD COLUMN IF NOT EXISTS arrival_time_actual timestamptz;
