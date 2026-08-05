package com.traveloptix.config;

import com.traveloptix.model.Attraction;
import com.traveloptix.model.Event;
import com.traveloptix.repository.AttractionRepository;
import com.traveloptix.repository.EventRepository;
import com.traveloptix.model.TourGuide;
import com.traveloptix.model.User;
import com.traveloptix.repository.TourGuideRepository;
import com.traveloptix.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Configuration
public class DataSeeder {

    // ═══ ATTRACTIONS ═══════════════════════════════════════
    @Bean
    CommandLineRunner seedAttractions(AttractionRepository repo) {
        return args -> {
            Set<String> existing = repo.findAll().stream()
                    .map(a -> a.getName().toLowerCase())
                    .collect(Collectors.toSet());

            List<Attraction> seeds = List.of(
                site("Mole National Park",
                        "Ghana's largest wildlife reserve. Spot elephants, antelopes, baboons and over 300 bird species on a guided safari.",
                        "Damongo", "Savannah", "Wildlife",
                        12.0, "06:00", "18:00"),

                site("Wli Waterfalls",
                        "The tallest waterfall in West Africa, cascading 80 metres through the Agumatsa forest reserve.",
                        "Hohoe", "Volta", "Nature",
                        5.0, "07:00", "17:00"),

                site("Elmina Castle",
                        "Built by the Portuguese in 1482, this UNESCO World Heritage Site is the oldest European building in sub-Saharan Africa.",
                        "Elmina", "Central", "History",
                        8.0, "08:00", "17:00"),

                site("Aburi Botanical Gardens",
                        "Historic 19th-century gardens with towering silk cotton trees, orchids and sweeping views of the Accra plains.",
                        "Aburi", "Eastern", "Nature",
                        3.0, "08:00", "17:00"),

                site("Nzulezo Stilt Village",
                        "A village built entirely on stilts over Lake Tadane — reachable only by canoe through lush wetlands.",
                        "Beyin", "Western", "Culture",
                        10.0, "08:00", "16:00"),

                site("Lake Bosomtwe",
                        "Ghana's only natural lake, formed in an ancient meteorite crater — perfect for swimming, kayaking and lakeside relaxation.",
                        "Bosomtwe", "Ashanti", "Nature",
                        2.0, "06:00", "18:00"),

                site("Boti Falls",
                        "Twin 'male and female' waterfalls hidden in the forests of the Eastern Region, most powerful in the rainy season.",
                        "Boti", "Eastern", "Nature",
                        4.0, "07:00", "17:00"),

                site("Busua Beach",
                        "Ghana's most famous surf beach — golden sand, palm trees, fresh seafood and laid-back coastal vibes.",
                        "Busua", "Western", "Beach",
                        0.0, "06:00", "22:00"),

                site("Labadi Beach",
                        "Accra's most popular beach — live music, horseback rides, food stalls and Atlantic waves.",
                        "Labadi, Accra", "Greater Accra", "Beach",
                        2.0, "06:00", "22:00"),

                site("Shai Hills Resource Reserve",
                        "Savanna reserve on Accra's doorstep — baboons, zebras, ostriches and ancient caves to explore.",
                        "Shai Hills", "Greater Accra", "Wildlife",
                        6.0, "06:00", "17:00"),

                site("Mount Afadjato",
                        "Hike to the summit of Ghana's highest peak (885m) for panoramic views over the Volta Region and the Togo border.",
                        "Liati Wote", "Volta", "Adventure",
                        4.0, "06:00", "16:00"),

                site("Larabanga Mosque",
                        "Ghana's oldest mosque, built in the 15th century in striking white Sudanese mud-and-stick style.",
                        "Larabanga", "Savannah", "History",
                        2.0, "08:00", "17:00"),

                site("Paga Crocodile Pond",
                        "Sit beside (and even touch) sacred crocodiles believed to be harmless — a truly unique cultural experience.",
                        "Paga", "Upper East", "Culture",
                        5.0, "07:00", "17:00")
            );

            int added = 0;
            for (Attraction a : seeds) {
                if (!existing.contains(a.getName().toLowerCase())) {
                    repo.save(a);
                    added++;
                }
            }

            System.out.println("✅ Seeder: added " + added + " new attractions (" + repo.count() + " total)");
        };
    }

    private Attraction site(String name, String description, String location,
                            String region, String category, double entryFee,
                            String opens, String closes) {
        Attraction a = new Attraction();
        a.setName(name);
        a.setDescription(description);
        a.setLocation(location);
        a.setRegion(region);
        a.setCategory(category);
        a.setEntryFee(entryFee);
        a.setOpeningTime(LocalTime.parse(opens));
        a.setClosingTime(LocalTime.parse(closes));
        a.setIsActive(true);
        return a;
    }

    // ═══ EVENTS — names EXACTLY match the app's local list ═
    @Bean
    CommandLineRunner seedEvents(EventRepository repo) {
        return args -> {

            // ✅ Remove old seeded names that would clash/duplicate
            List<String> oldNames = List.of(
                    "homowo", "aboakyir festival", "farmers' day",
                    "independence day");
            repo.findAll().stream()
                    .filter(e -> oldNames.contains(e.getName().toLowerCase()))
                    .forEach(repo::delete);

            Set<String> existing = repo.findAll().stream()
                    .map(e -> e.getName().toLowerCase())
                    .collect(Collectors.toSet());

            List<Event> seeds = List.of(
                holiday("Independence Day Celebration",
                        "Ghana's Independence Day is celebrated every 6th March with parades, cultural performances, and national events.",
                        "Nationwide", "Ghana", "2026-03-06"),

                holiday("Republic Day",
                        "Republic Day commemorates Ghana becoming a republic on 1st July, celebrated with civic and cultural activities.",
                        "Nationwide", "Ghana", "2026-07-01"),

                holiday("National Farmers' Day",
                        "A national holiday honouring farmers and fishers across Ghana for their contribution to the country.",
                        "Nationwide", "Ghana", "2026-12-04"),

                holiday("Founders' Day",
                        "Honours the Big Six and all who fought for Ghana's independence, with wreath-laying and heritage events.",
                        "Kwame Nkrumah Memorial Park, Accra", "Greater Accra",
                        "2026-08-04"),

                holiday("Kwame Nkrumah Memorial Day",
                        "Celebrates the birthday of Ghana's first President with lectures, exhibitions and ceremonies.",
                        "Kwame Nkrumah Memorial Park, Accra", "Greater Accra",
                        "2026-09-21"),

                holiday("Constitution Day",
                        "Marks the birth of the Fourth Republic in 1993 — civic education events and national reflection.",
                        "Accra", "Greater Accra", "2027-01-07"),

                festival("Homowo Festival",
                        "A Ga traditional festival celebrated in Greater Accra to remember victory over famine, with food, music, and cultural rites.",
                        "Accra", "Greater Accra", "2026-08-01", "50.00"),

                festival("Aboakyer Festival",
                        "A famous deer-hunting festival celebrated by the people of Winneba, filled with tradition, processions, and cultural displays.",
                        "Winneba", "Central Region", "2026-05-01", "60.00"),

                festival("Hogbetsotso Festival",
                        "A major Anlo-Ewe festival in the Volta Region celebrating migration history, unity, dance, and traditional culture.",
                        "Anloga", "Volta Region", "2026-11-01", "45.00"),

                festival("Chale Wote Street Art Festival",
                        "A vibrant street art festival in Accra featuring murals, performances, fashion, music, and contemporary African art.",
                        "Accra", "Greater Accra", "2026-08-18", "80.00"),

                festival("Panafest",
                        "A Pan-African cultural festival held mainly in Cape Coast and Elmina, celebrating African heritage, history, and unity.",
                        "Cape Coast", "Central Region", "2026-07-20", "100.00"),

                festival("Kwahu Easter Festival",
                        "One of Ghana's biggest Easter celebrations, known for paragliding, concerts, street events, and tourism activities.",
                        "Kwahu", "Eastern Region", "2026-04-03", "75.00"),

                festival("AfroFuture Festival",
                        "A popular December festival in Accra celebrating African music, food, fashion, art, and culture.",
                        "Accra", "Greater Accra", "2026-12-28", "250.00"),

                festival("Fetu Afahye",
                        "Cape Coast's vibrant harvest festival — colourful processions of the Asafo companies and the Omanhen's grand durbar.",
                        "Cape Coast", "Central Region", "2026-09-05", "0.00"),

                festival("Adae Kese",
                        "The Ashanti kingdom's grandest festival at Manhyia Palace — the Asantehene sits in state amid drumming and gold regalia.",
                        "Manhyia Palace, Kumasi", "Ashanti", "2026-12-27", "20.00"),

                festival("Kundum Festival",
                        "Ancient harvest festival of the Nzema people — drumming, dancing and feasting to thank the gods for abundance.",
                        "Nzema", "Western Region", "2026-09-12", "0.00")
            );

            int added = 0;
            for (Event e : seeds) {
                if (!existing.contains(e.getName().toLowerCase())) {
                    repo.save(e);
                    added++;
                }
            }

            System.out.println("✅ Seeder: added " + added + " new events (" + repo.count() + " total)");
        };
    }

    private Event holiday(String name, String description, String location,
                          String region, String date) {
        return event(name, description, "HOLIDAY", location, region,
                date, "08:00", "18:00", "0.00", 1000);
    }

    private Event festival(String name, String description, String location,
                           String region, String date, String price) {
        return event(name, description, "FESTIVAL", location, region,
                date, "08:00", "21:00", price, 500);
    }

    private Event event(String name, String description, String type,
                        String location, String region, String date,
                        String opens, String closes, String price, int maxPeople) {
        Event e = new Event();
        e.setName(name);
        e.setDescription(description);
        e.setEventType(type);
        e.setLocation(location);
        e.setRegion(region);
        e.setEventDate(LocalDate.parse(date));
        e.setStartTime(LocalTime.parse(opens));
        e.setEndTime(LocalTime.parse(closes));
        e.setPricePerPerson(new BigDecimal(price));
        e.setMaxParticipants(maxPeople);
        e.setIsActive(true);
        return e;
    }
// ═══ TOUR GUIDES ═══════════════════════════════════════
    @Bean
    CommandLineRunner seedGuides(UserRepository userRepo, TourGuideRepository guideRepo) {
        return args -> {
            List<Object[]> seeds = List.of(
                new Object[]{"Kwame Mensah", "kwame.guide@traveloptix.app", "0200000001",
                        "English, Twi", "History, Culture", 5,
                        "Experienced guide specializing in historical sites across the Central and Greater Accra regions.",
                        new BigDecimal("60.00")},
                new Object[]{"Ama Owusu", "ama.guide@traveloptix.app", "0200000002",
                        "English, Ewe, French", "Nature, Adventure", 7,
                        "Passionate about eco-tourism and hiking tours through the Volta and Eastern regions.",
                        new BigDecimal("75.00")},
                new Object[]{"Yaw Boateng", "yaw.guide@traveloptix.app", "0200000003",
                        "English, Twi, Ga", "Wildlife, Culture", 4,
                        "Wildlife safari specialist with deep knowledge of Mole National Park and Shai Hills.",
                        new BigDecimal("55.00")},
                new Object[]{"Efua Asante", "efua.guide@traveloptix.app", "0200000004",
                        "English, Fante", "Beach, History", 6,
                        "Coastal region expert covering Cape Coast, Elmina, and the Central Region's heritage sites.",
                        new BigDecimal("65.00")}
            );

            int added = 0;
            for (Object[] s : seeds) {
                String email = (String) s[1];
                if (userRepo.existsByEmail(email)) continue;

                User u = new User();
                u.setFullName((String) s[0]);
                u.setEmail(email);
                u.setPhone((String) s[2]);
                u.setPasswordHash("SEEDED_NO_LOGIN");
                u.setRole("TOUR_GUIDE");
                u.setIsVerified(true);
                u.setIsActive(true);
                userRepo.save(u);

                TourGuide g = new TourGuide();
                g.setUser(u);
                g.setLanguages((String) s[3]);
                g.setExpertiseAreas((String) s[4]);
                g.setYearsExperience((Integer) s[5]);
                g.setBio((String) s[6]);
                g.setHourlyRate((BigDecimal) s[7]);
                g.setVerificationStatus("APPROVED");
                guideRepo.save(g);

                added++;
            }

            System.out.println("✅ Seeder: added " + added + " new tour guides (" + guideRepo.count() + " total)");
        };
    }
}