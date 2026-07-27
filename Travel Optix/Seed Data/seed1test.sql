-- Confirm all tables have correct record counts
SELECT 'Users'            AS TableName, COUNT(*) AS TotalRecords FROM Users
UNION ALL
SELECT 'Tourists',                       COUNT(*) FROM Tourists
UNION ALL
SELECT 'TourGuides',                     COUNT(*) FROM TourGuides
UNION ALL
SELECT 'HostFamilies',                   COUNT(*) FROM HostFamilies
UNION ALL
SELECT 'Attractions',                    COUNT(*) FROM Attractions
UNION ALL
SELECT 'Transportation',                 COUNT(*) FROM Transportation
UNION ALL
SELECT 'Events',                         COUNT(*) FROM Events
UNION ALL
SELECT 'Bookings',                       COUNT(*) FROM Bookings
UNION ALL
SELECT 'Payments',                       COUNT(*) FROM Payments
UNION ALL
SELECT 'EmergencyContacts',              COUNT(*) FROM EmergencyContacts
UNION ALL
SELECT 'Notifications',                  COUNT(*) FROM Notifications
UNION ALL
SELECT 'Reviews',                        COUNT(*) FROM Reviews;