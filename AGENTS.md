# Codex Agent Guidelines: BOOKSI_MOBILE_BIZNES

## Cel Projektu
Aplikacja Mobilna (Biznesowa) dla pracowników i właścicieli salonów w platformie RIVIE/BOOKSI. Posiada obsługę trybu offline oraz rozszerzone narzędzia (m.in. Caller ID, rezerwacje, grafik).

## Główne Technologie
- **Platforma:** Expo (~54.0) / React Native (0.81.5), TypeScript
- **Nawigacja:** React Navigation (Bottom Tabs, Native Stack)
- **Komunikacja API:** Axios
- **Kluczowe Biblioteki:** `react-native-call-detection` (Caller ID), AsyncStorage + NetInfo (Tryb Offline/Sync), Local Authentication, Secure Store.

## Najważniejsze Reguły Architektoniczne
1. **Tryb Offline i Synchronizacja:** Aplikacja mocno polega na AsyncStorage i bibliotece NetInfo do wykrywania stanu sieci. W przypadku modyfikacji upewnij się, że nie przerywasz mechanizmów synchronizacji offline-online.
2. **Caller ID (Call Detection):** Aplikacja przechwytuje połączenia, by pomóc identyfikować klienta na podstawie bazy salonu. Manipulowanie modułem `react-native-call-detection` musi być wykonywane ze szczególną uwagą na uprawnienia Android/iOS.
3. **Logowanie Natywne:** Local Authentication (odcisk palca / face ID) współpracuje z SecureStore. To obszar wysokiego ryzyka bezpieczeństwa.

## Miejsca Wymagające Szczególnej Ostrożności
- **Zarządzanie Kalendarzem / Terminarzem (react-native-calendars):** Serce aplikacji biznesowej. Wyświetlanie nakładających się grafików, zmian czy rezerwacji (drag&drop/podgląd) musi pozostać niezawodne.
- **Bezpieczeństwo i Stan Aplikacji:** Przechowywanie danych biznesowych lokalnie. Zawsze stosuj bezpieczne przechowywanie wrażliwych danych.

## Komendy Weryfikacyjne
* Narzędzia testujące: Dostępny jest plik `jest.config.js`. Uruchomienie testów lokalnych to polecenie: `npm test` lub specyficznie `npm test -- <NazwaPliku>`.
* Uruchamiaj wyłącznie konkretny suite lub najmniejszy potrzebny test. Nie wykonuj globalnego `npm test` po jednej małej zmianie.
* Budowanie/Uruchamianie lokalne: `npx expo start`.

## Zasady Modyfikacji i Ochrona Działającego Kodu (KRYTYCZNE)
1. **This is an existing production project.** Zachowaj istniejącą działającą funkcjonalność.
2. **Make the smallest safe change necessary.** Mobilne aplikacje, zwłaszcza korzystające z modułów takich jak wykrywanie połączeń, są wrażliwe na crash'e przy zmianie stanu/lifecycle.
3. **Diagnose before you edit.** Nie edytuj komponentów "na ślepo". Wykryj najpierw problem opierając się na logice lub plikach. Oznaczaj luki w rozumieniu kodu z użyciem pytań do użytkownika, nie używaj zgadywanek.
4. Używaj istniejących wzorców np. dla zarządzania stanem, komunikacji API i synchronizacji (queue / cache). Nie próbuj wymieniać Axios na `fetch` ani zmieniać AsyncStorage na inną bibliotekę.
5. **Oszczędzaj kontekst (Token/Context Efficiency):**
   Używaj precyzyjnego wyszukiwania.
   Czytaj tylko pliki związane z aktualnym zadaniem.
   Nie skanuj całego repozytorium bez potrzeby.
   Nie pobieraj pełnej historii Git.
6. Nie przeprowadzaj destrukcyjnych zmian Git (brak poleceń typu `git checkout -- .`, `git clean`). Nie deploy'uj na Stores bez zgody.
7. Nie wymuszaj zmian na innych częściach ekosystemu (BOOKSI_API) o ile nie jest to spójnie zatwierdzona zmiana kontraktów.
8. **Plan before modification:**
   Before changing code, briefly establish:
   - the root cause or intended change,
   - files/screens/modules that need modification,
   - the minimal proposed solution,
   - how the change will be verified.

   Do not modify code before this plan is established.
9. **Verification:**
   - Run the most specific relevant test first.
   - Run broader regression tests only when relevant to the changed area.
   - If the change affects native functionality, perform the relevant manual verification.
   - Do not claim a change is verified if it was not actually tested.
   - Do not modify tests merely to make them pass.