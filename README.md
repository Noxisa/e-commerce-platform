# 🪵 FurniWood – Custom Wooden Furniture E-commerce

Modernna, responsywna platforma do zamawiania mebli na wymiar z drewna. Prosta, czytelna i przyjemna w obsłudze – zarówno na komputerze, tablecie, jak i telefonie.

<p align="center">
  <img src="https://via.placeholder.com/800x400.png?text=FurniWood+Hero+Screenshot" alt="FurniWood – widok główny" width="800"/>
  <br/>
  <em>Strona główna – minimalistyczny i ciepły design</em>
</p>

## 🌟 O projekcie

FurniWood powstał z myślą o osobach, które szukają **unikalnych, drewnianych mebli szytych na miarę** – bez zbędnego scrollowania i skomplikowanych konfiguratorów.

Główne możliwości dla użytkownika:
- Przeglądanie gotowych produktów z dokładnymi informacjami
- Wybór rodzaju drewna, wybarwienia i wariantów
- Składanie zapytań o meble **na wymiar** (wymiary + notatki)
- Proste i bezpieczne konto użytkownika

Platforma jest zaprojektowana tak, aby była:
- zrozumiała nawet dla osób nietechnicznych
- estetyczna i nowoczesna
- w 100% responsywna (mobile-first)

## ✨ Główne funkcjonalności

| Ikona      | Funkcja                        | Opis                                                                 |
|------------|--------------------------------|----------------------------------------------------------------------|
| 🛋️        | Katalog mebli                  | Przeglądanie produktów z filtrami (dąb, wiśnia, jesion itd.)        |
| 📝        | Zapytania o meble na wymiar    | Formularz z wymiarami, wyborem drewna, kolorem i dodatkowymi uwagami |
| 👤        | Konto użytkownika              | Rejestracja / logowanie (email + hasło), opcjonalnie Google         |
| 📱        | Pełna responsywność            | Idealnie wygląda na telefonach, tabletach i desktopach              |
| ♿        | Dostępność (accessibility)     | Hamburger menu, nawigacja klawiaturą, struktura przyjazna czytnikom ekranu |
| ⚡        | Wydajność                      | Szybkie ładowanie, zoptymalizowane zapytania API                    |

## 🛠️ Technologie

| Część       | Technologia / Narzędzie              | Wersja / Uwagi                  |
|-------------|--------------------------------------|---------------------------------|
| Frontend    | React 18                             | Hooks, Context / Redux (opcjonalnie) |
| Routing     | React Router v6                      |                                 |
| Walidacja   | Yup + Formik / React Hook Form       |                                 |
| API         | Axios                                | Interceptors, error handling    |
| Bezpieczeństwo | DOMPurify                         | Ochrona przed XSS               |
| Styling     | CSS (variables + responsive)         | Bez frameworków typu Tailwind   |
| Backend     | Node.js + Express                    | REST API                        |
| Baza danych | PostgreSQL                           | Relacyjna, migracje             |
| Autentykacja| JWT + Bcrypt                         | Hashowanie haseł                |
| E-maile     | Nodemailer                           | Powiadomienia o zapytaniach     |
| Inne        | CORS, npm, Git, GitHub               |                                 |

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"/>
  &nbsp;
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT"/>
</p>

## 🚀 Jak uruchomić projekt lokalnie

### Wymagania
- Node.js ≥ 18
- PostgreSQL (lokalnie lub w kontenerze)

### Instalacja

```bash
# Klonowanie repozytorium
git clone https://github.com/TWOJA_NAZWA_UZYTKOWNIKA/furniwood.git
cd furniwood

# Instalacja zależności (frontend + backend w monorepo lub osobno)
npm install

# Uruchomienie trybu developerskiego
npm run dev
# lub osobno:
# cd client && npm run dev
# cd server && npm run dev
