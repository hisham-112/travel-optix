-- ============================================================
-- TABLE 1: USERS (Parent Table — Created First)
-- ============================================================
CREATE TABLE Users (
    user_id       SERIAL PRIMARY KEY,
    full_name     VARCHAR(100)  NOT NULL,
    email         VARCHAR(150)  NOT NULL UNIQUE,
    phone         VARCHAR(20)   NOT NULL UNIQUE,
    password_hash VARCHAR(255)  NOT NULL,
    role          VARCHAR(20)   NOT NULL
                  CHECK (role IN (
                      'TOURIST',
                      'TOUR_GUIDE',
                      'HOST_FAMILY',
                      'ADMIN'
                  )),
    profile_photo VARCHAR(255)  NULL,
    is_verified   BOOLEAN       DEFAULT FALSE,
    is_active     BOOLEAN       DEFAULT TRUE,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 2: TOURISTS (Needs Users)
-- ============================================================
CREATE TABLE Tourists (
    tourist_id       SERIAL PRIMARY KEY,
    user_id          INT          NOT NULL UNIQUE,
    nationality      VARCHAR(100) NULL,
    passport_number  VARCHAR(50)  NULL,
    date_of_birth    DATE         NULL,
    travel_pass_code VARCHAR(50)  NULL UNIQUE,
    created_at       TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_tourist_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE
);

-- ============================================================
-- TABLE 3: TOUR GUIDES (Needs Users)
-- ============================================================
CREATE TABLE TourGuides (
    guide_id            SERIAL PRIMARY KEY,
    user_id             INT           NOT NULL UNIQUE,
    languages           VARCHAR(255)  NULL,
    expertise_areas     VARCHAR(255)  NULL,
    years_experience    INT           DEFAULT 0,
    id_document_url     VARCHAR(255)  NULL,
    verification_status VARCHAR(20)   DEFAULT 'PENDING'
                        CHECK (verification_status IN (
                            'PENDING',
                            'APPROVED',
                            'REJECTED'
                        )),
    verified_at         TIMESTAMP     NULL,
    verified_by         INT           NULL,
    bio                 TEXT          NULL,
    hourly_rate         DECIMAL(10,2) NULL,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_guide_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_guide_verified_by
        FOREIGN KEY (verified_by)
        REFERENCES Users(user_id)
        ON DELETE SET NULL
);

-- ============================================================
-- TABLE 4: HOST FAMILIES (Needs Users)
-- ============================================================
CREATE TABLE HostFamilies (
    family_id           SERIAL PRIMARY KEY,
    user_id             INT           NOT NULL UNIQUE,
    family_name         VARCHAR(150)  NULL,
    address             TEXT          NOT NULL,
    region              VARCHAR(100)  NULL,
    max_guests          INT           DEFAULT 1,
    id_document_url     VARCHAR(255)  NULL,
    address_proof_url   VARCHAR(255)  NULL,
    verification_status VARCHAR(20)   DEFAULT 'PENDING'
                        CHECK (verification_status IN (
                            'PENDING',
                            'APPROVED',
                            'REJECTED'
                        )),
    verified_at         TIMESTAMP     NULL,
    verified_by         INT           NULL,
    description         TEXT          NULL,
    created_at          TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_family_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_family_verified_by
        FOREIGN KEY (verified_by)
        REFERENCES Users(user_id)
        ON DELETE SET NULL
);

-- ============================================================
-- TABLE 5: ATTRACTIONS (Needs Users)
-- ============================================================
CREATE TABLE Attractions (
    attraction_id SERIAL PRIMARY KEY,
    name          VARCHAR(200)  NOT NULL,
    description   TEXT          NULL,
    location      VARCHAR(255)  NULL,
    region        VARCHAR(100)  NULL,
    category      VARCHAR(20)   NULL
                  CHECK (category IN (
                      'MUSEUM',
                      'PARK',
                      'BEACH',
                      'HISTORICAL',
                      'CULTURAL',
                      'OTHER'
                  )),
    entry_fee     DECIMAL(10,2) DEFAULT 0.00,
    opening_time  TIME          NULL,
    closing_time  TIME          NULL,
    photo_url     VARCHAR(255)  NULL,
    is_active     BOOLEAN       DEFAULT TRUE,
    created_by    INT           NULL,
    created_at    TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_attraction_admin
        FOREIGN KEY (created_by)
        REFERENCES Users(user_id)
        ON DELETE SET NULL
);

-- ============================================================
-- TABLE 6: TRANSPORTATION (No Dependencies)
-- ============================================================
CREATE TABLE Transportation (
    transport_id    SERIAL PRIMARY KEY,
    type            VARCHAR(20)   NOT NULL
                    CHECK (type IN (
                        'BUS',
                        'TAXI',
                        'BOAT',
                        'TRAIN',
                        'SHUTTLE'
                    )),
    provider_name   VARCHAR(150)  NULL,
    route_from      VARCHAR(150)  NULL,
    route_to        VARCHAR(150)  NULL,
    departure_time  TIMESTAMP     NULL,
    arrival_time    TIMESTAMP     NULL,
    price           DECIMAL(10,2) NULL,
    available_seats INT           DEFAULT 0,
    is_active       BOOLEAN       DEFAULT TRUE,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- TABLE 7: EVENTS (Needs HostFamilies)
-- ============================================================
CREATE TABLE Events (
    event_id         SERIAL PRIMARY KEY,
    family_id        INT           NULL,
    name             VARCHAR(200)  NOT NULL,
    description      TEXT          NULL,
    event_type       VARCHAR(20)   NULL
                     CHECK (event_type IN (
                         'FESTIVAL',
                         'CELEBRATION',
                         'CEREMONY',
                         'COOKING',
                         'CULTURAL',
                         'OTHER'
                     )),
    location         VARCHAR(255)  NULL,
    event_date       DATE          NOT NULL,
    start_time       TIME          NULL,
    end_time         TIME          NULL,
    max_participants INT           DEFAULT 10,
    price_per_person DECIMAL(10,2) DEFAULT 0.00,
    is_active        BOOLEAN       DEFAULT TRUE,
    created_at       TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_event_family
        FOREIGN KEY (family_id)
        REFERENCES HostFamilies(family_id)
        ON DELETE SET NULL
);

-- ============================================================
-- TABLE 8: BOOKINGS (Needs Tourists)
-- ============================================================
CREATE TABLE Bookings (
    booking_id     SERIAL PRIMARY KEY,
    tourist_id     INT           NOT NULL,
    booking_type   VARCHAR(20)   NOT NULL
                   CHECK (booking_type IN (
                       'ATTRACTION',
                       'TRANSPORT',
                       'TOUR_GUIDE',
                       'EVENT'
                   )),
    reference_id   INT           NOT NULL,
    booking_date   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    scheduled_date DATE          NOT NULL,
    status         VARCHAR(20)   DEFAULT 'PENDING'
                   CHECK (status IN (
                       'PENDING',
                       'CONFIRMED',
                       'CANCELLED',
                       'COMPLETED'
                   )),
    total_amount   DECIMAL(10,2) NULL,
    notes          TEXT          NULL,

    CONSTRAINT fk_booking_tourist
        FOREIGN KEY (tourist_id)
        REFERENCES Tourists(tourist_id)
        ON DELETE CASCADE
);

-- ============================================================
-- TABLE 9: PAYMENTS (Needs Bookings + Tourists)
-- ============================================================
CREATE TABLE Payments (
    payment_id      SERIAL PRIMARY KEY,
    booking_id      INT           NOT NULL UNIQUE,
    tourist_id      INT           NOT NULL,
    amount          DECIMAL(10,2) NOT NULL,
    currency        VARCHAR(10)   DEFAULT 'GHS',
    payment_method  VARCHAR(20)   NOT NULL
                    CHECK (payment_method IN (
                        'MOBILE_MONEY',
                        'CARD',
                        'CASH'
                    )),
    payment_status  VARCHAR(20)   DEFAULT 'PENDING'
                    CHECK (payment_status IN (
                        'PENDING',
                        'SUCCESS',
                        'FAILED',
                        'REFUNDED'
                    )),
    transaction_ref VARCHAR(255)  NULL,
    paid_at         TIMESTAMP     NULL,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_payment_booking
        FOREIGN KEY (booking_id)
        REFERENCES Bookings(booking_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_payment_tourist
        FOREIGN KEY (tourist_id)
        REFERENCES Tourists(tourist_id)
        ON DELETE NO ACTION
);

-- ============================================================
-- TABLE 10: EMERGENCY CONTACTS (Needs Tourists)
-- ============================================================
CREATE TABLE EmergencyContacts (
    contact_id   SERIAL PRIMARY KEY,
    tourist_id   INT          NOT NULL,
    full_name    VARCHAR(100) NOT NULL,
    relationship VARCHAR(50)  NULL,
    phone        VARCHAR(20)  NOT NULL,
    email        VARCHAR(150) NULL,
    is_primary   BOOLEAN      DEFAULT FALSE,
    created_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_emergency_tourist
        FOREIGN KEY (tourist_id)
        REFERENCES Tourists(tourist_id)
        ON DELETE CASCADE
);

-- ============================================================
-- TABLE 11: NOTIFICATIONS (Needs Users + Bookings)
-- ============================================================
CREATE TABLE Notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id         INT           NOT NULL,
    booking_id      INT           NULL,
    title           VARCHAR(200)  NULL,
    message         TEXT          NOT NULL,
    type            VARCHAR(20)   NULL
                    CHECK (type IN (
                        'BOOKING',
                        'PAYMENT',
                        'GUARDIAN_ALERT',
                        'VERIFICATION',
                        'SYSTEM'
                    )),
    channel         VARCHAR(10)   DEFAULT 'PUSH'
                    CHECK (channel IN (
                        'SMS',
                        'EMAIL',
                        'PUSH'
                    )),
    is_read         BOOLEAN       DEFAULT FALSE,
    sent_at         TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_notif_user
        FOREIGN KEY (user_id)
        REFERENCES Users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notif_booking
        FOREIGN KEY (booking_id)
        REFERENCES Bookings(booking_id)
        ON DELETE SET NULL
);

-- ============================================================
-- TABLE 12: REVIEWS (Needs Tourists)
-- ============================================================
CREATE TABLE Reviews (
    review_id    SERIAL PRIMARY KEY,
    tourist_id   INT           NOT NULL,
    review_type  VARCHAR(20)   NULL
                 CHECK (review_type IN (
                     'ATTRACTION',
                     'TOUR_GUIDE',
                     'EVENT',
                     'HOST_FAMILY'
                 )),
    reference_id INT           NOT NULL,
    rating       SMALLINT      NULL
                 CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT          NULL,
    created_at   TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_review_tourist
        FOREIGN KEY (tourist_id)
        REFERENCES Tourists(tourist_id)
        ON DELETE CASCADE
);