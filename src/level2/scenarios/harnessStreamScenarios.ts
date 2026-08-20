/* GENERATED FILE — DO NOT EDIT BY HAND.
   Written by scripts/convertHarnessStreamCaptures.ts from the 10 real
   captured harness turn-event streams in scripts/fixtures/harness-stream/.
   Regenerate with:

     npx tsx scripts/convertHarnessStreamCaptures.ts

   Every scenario here is real agent output (source: 'harness_stream'), run
   through the SAME classifier/pass-builder/final-response pipeline every
   other source uses — see src/level2/harnessStream/buildScenarioFromHarnessStream.ts. */

import type { Level2Scenario } from '../types/scenario';

export const HARNESS_STREAM_SCENARIOS: Level2Scenario[] = [
  {
    "id": "harness-q01",
    "archetype": "list",
    "prompt": "show backpacks for school for male and female",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q01",
    "thinkingPasses": [
      {
        "id": "list-acknowledge",
        "visibility": "canvas_value",
        "narration": "On it — seeing what's out there.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1300,
        "exitDuration": 250,
        "valueType": "intent",
        "payload": {
          "chips": [
            "Backpacks",
            "School"
          ]
        }
      },
      {
        "id": "list-scale",
        "visibility": "status",
        "narration": "20 results surfaced — narrowing to what matters",
        "confidence": "high",
        "enterDuration": 450,
        "holdDuration": 1500,
        "exitDuration": 250
      },
      {
        "id": "list-found",
        "visibility": "canvas_value",
        "narration": "Found 10 options worth exploring",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-11",
              "type": "generic",
              "title": "URBAN CARRIER Unisex School Backpack",
              "subtitle": "URBAN CARRIER",
              "location": "URBAN CARRIER",
              "externalId": "16b187ce-ad03-5079-8897-0075cf76af25",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/05/c5e7e583f3398493714c14b35807c1c5cb9ed6b1.jpg",
              "price": "₹562",
              "judgment": "Budget Pick",
              "reasoning": "affordable and durable for daily use",
              "attributes": {
                "ctaUrl": "https://www.myntra.com/backpacks/urban+carrier/urban-carrier-unisex-school--backpack/32496179/buy",
                "visualQuery": "URBAN CARRIER Unisex School Backpack"
              },
              "raw": "<card title=\"URBAN CARRIER Unisex School Backpack\" place_id=\"16b187ce-ad03-5079-8897-0075cf76af25\"><badge>Budget Pick</badge><price>₹562</price><why>affordable and durable for daily use</why><visual query=\"URBAN CARRIER Unisex School Backpack\" title=\"URBAN CARRIER Unisex School Backpack\" place_id=\"16b187ce-ad03-5079-8897-0075cf76af25\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/05/c5e7e583f3398493714c14b35807c1c5cb9ed6b1.jpg\"/><cta>https://www.myntra.com/backpacks/urban+carrier/urban-carrier-unisex-school--backpack/32496179/buy</cta></card>"
            },
            {
              "id": "entity-12",
              "type": "generic",
              "title": "Solid School Backpack",
              "subtitle": "Savana",
              "location": "Savana",
              "externalId": "1474304e-61db-5fe9-b521-9cb5a868d830",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/ce0fc264ddb8fb493e03db5930c68e3a26c853e3.jpg",
              "price": "₹763",
              "judgment": "Value Pick",
              "reasoning": "lightweight with great capacity",
              "attributes": {
                "ctaUrl": "https://www.savana.com/details/solid-school-backpack-1887622",
                "visualQuery": "Solid School Backpack"
              },
              "raw": "<card title=\"Solid School Backpack\" place_id=\"1474304e-61db-5fe9-b521-9cb5a868d830\"><badge>Value Pick</badge><price>₹763</price><why>lightweight with great capacity</why><visual query=\"Solid School Backpack\" title=\"Solid School Backpack\" place_id=\"1474304e-61db-5fe9-b521-9cb5a868d830\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/ce0fc264ddb8fb493e03db5930c68e3a26c853e3.jpg\"/><cta>https://www.savana.com/details/solid-school-backpack-1887622</cta></card>"
            },
            {
              "id": "entity-13",
              "type": "generic",
              "title": "Solid School Backpack",
              "subtitle": "Savana",
              "location": "Savana",
              "externalId": "0b487109-f813-59fe-95be-b674816820fe",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/67fcd9dc67ceb311ae64d8fdf8b567f93d919ac8.jpg",
              "price": "₹817",
              "judgment": "Solid Choice",
              "reasoning": "classic design, reliable brand",
              "attributes": {
                "ctaUrl": "https://www.savana.com/details/solid-school-backpack-1893232",
                "visualQuery": "Solid School Backpack"
              },
              "raw": "<card title=\"Solid School Backpack\" place_id=\"0b487109-f813-59fe-95be-b674816820fe\"><badge>Solid Choice</badge><price>₹817</price><why>classic design, reliable brand</why><visual query=\"Solid School Backpack\" title=\"Solid School Backpack\" place_id=\"0b487109-f813-59fe-95be-b674816820fe\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/67fcd9dc67ceb311ae64d8fdf8b567f93d919ac8.jpg\"/><cta>https://www.savana.com/details/solid-school-backpack-1893232</cta></card>"
            },
            {
              "id": "entity-14",
              "type": "generic",
              "title": "Patched School Backpack",
              "subtitle": "Savana",
              "location": "Savana",
              "externalId": "91267493-fccb-53cf-bd81-913aa66380f6",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/b09bcf2d699d77d268ce627c63d88cb1d080cbd0.jpg",
              "price": "₹1011",
              "judgment": "Trendy Style",
              "reasoning": "patched design for personality",
              "attributes": {
                "ctaUrl": "https://www.savana.com/details/patched-school-backpack-1887692",
                "visualQuery": "Patched School Backpack"
              },
              "raw": "<card title=\"Patched School Backpack\" place_id=\"91267493-fccb-53cf-bd81-913aa66380f6\"><badge>Trendy Style</badge><price>₹1011</price><why>patched design for personality</why><visual query=\"Patched School Backpack\" title=\"Patched School Backpack\" place_id=\"91267493-fccb-53cf-bd81-913aa66380f6\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/b09bcf2d699d77d268ce627c63d88cb1d080cbd0.jpg\"/><cta>https://www.savana.com/details/patched-school-backpack-1887692</cta></card>"
            },
            {
              "id": "entity-15",
              "type": "generic",
              "title": "Skybags Unisex Manga Anime Black School Backpack - 27L",
              "subtitle": "Skybags",
              "location": "Skybags",
              "externalId": "31755b71-12ee-54e8-9929-6f6aa246b249",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/63ca4d3b2313a6e9e3446c189e190c97c34bbd2a.jpg",
              "price": "₹1470",
              "judgment": "Anime Fun",
              "reasoning": "manga print, 3 compartments",
              "attributes": {
                "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-black-school-backpack-with-3-compartments--front-pocket---27l/39487174/buy",
                "visualQuery": "Skybags Unisex Manga Anime Black School Backpack - 27L"
              },
              "raw": "<card title=\"Skybags Unisex Manga Anime Black School Backpack - 27L\" place_id=\"31755b71-12ee-54e8-9929-6f6aa246b249\"><badge>Anime Fun</badge><price>₹1470</price><why>manga print, 3 compartments</why><visual query=\"Skybags Unisex Manga Anime Black School Backpack - 27L\" title=\"Skybags Unisex Manga Anime Black School Backpack - 27L\" place_id=\"31755b71-12ee-54e8-9929-6f6aa246b249\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/63ca4d3b2313a6e9e3446c189e190c97c34bbd2a.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-black-school-backpack-with-3-compartments--front-pocket---27l/39487174/buy</cta></card>"
            },
            {
              "id": "entity-16",
              "type": "generic",
              "title": "Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke",
              "subtitle": "Skybags",
              "location": "Skybags",
              "externalId": "33e37428-32e3-527f-b156-b4fb53b47c10",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/76e9143a8715e0f45201d6d0dc01817f0654b1c6.jpg",
              "price": "₹1470",
              "judgment": "Colorful Option",
              "reasoning": "teal anime design, front pocket",
              "attributes": {
                "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-teal-school-backpack-with-3-compartments--front-pocket---27l/39487175/buy",
                "visualQuery": "Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke"
              },
              "raw": "<card title=\"Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke\" place_id=\"33e37428-32e3-527f-b156-b4fb53b47c10\"><badge>Colorful Option</badge><price>₹1470</price><why>teal anime design, front pocket</why><visual query=\"Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke\" title=\"Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke\" place_id=\"33e37428-32e3-527f-b156-b4fb53b47c10\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/76e9143a8715e0f45201d6d0dc01817f0654b1c6.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-teal-school-backpack-with-3-compartments--front-pocket---27l/39487175/buy</cta></card>"
            },
            {
              "id": "entity-17",
              "type": "generic",
              "title": "Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L",
              "subtitle": "Skybags",
              "location": "Skybags",
              "externalId": "dcc6b46a-5d92-5690-853a-6717267fd726",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/7f1efe4750c2fcb15cab81dab6654a88b58c4279.jpg",
              "price": "₹2016",
              "judgment": "Premium Feature",
              "reasoning": "rain cover, 34L capacity",
              "attributes": {
                "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-kenshi-stealth-black-school-backpack-with-3-compartments--rain-cover---34l/39487183/buy",
                "visualQuery": "Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L"
              },
              "raw": "<card title=\"Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L\" place_id=\"dcc6b46a-5d92-5690-853a-6717267fd726\"><badge>Premium Feature</badge><price>₹2016</price><why>rain cover, 34L capacity</why><visual query=\"Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L\" title=\"Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L\" place_id=\"dcc6b46a-5d92-5690-853a-6717267fd726\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/7f1efe4750c2fcb15cab81dab6654a88b58c4279.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-kenshi-stealth-black-school-backpack-with-3-compartments--rain-cover---34l/39487183/buy</cta></card>"
            },
            {
              "id": "entity-18",
              "type": "generic",
              "title": "Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch",
              "subtitle": "Skybags",
              "location": "Skybags",
              "externalId": "f766f734-ead0-55ad-bccc-7fcb6862dfc7",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/12/6cc8c7ce881a20f7ddc1243c0699bb0ca77dbd5c.jpg",
              "price": "₹2688",
              "judgment": "Tiffin Ready",
              "reasoning": "insulated pouch included",
              "attributes": {
                "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-sizzler-pro-green-school-backpack-with-insulated-tiffin-pouch---39l/39487195/buy",
                "visualQuery": "Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch"
              },
              "raw": "<card title=\"Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch\" place_id=\"f766f734-ead0-55ad-bccc-7fcb6862dfc7\"><badge>Tiffin Ready</badge><price>₹2688</price><why>insulated pouch included</why><visual query=\"Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch\" title=\"Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch\" place_id=\"f766f734-ead0-55ad-bccc-7fcb6862dfc7\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/12/6cc8c7ce881a20f7ddc1243c0699bb0ca77dbd5c.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-sizzler-pro-green-school-backpack-with-insulated-tiffin-pouch---39l/39487195/buy</cta></card>"
            },
            {
              "id": "entity-19",
              "type": "generic",
              "title": "Solid School Backpack",
              "subtitle": "Savana",
              "location": "Savana",
              "externalId": "3c6ae584-961e-5ef6-af1e-2bf4e05d26d1",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/48fe0a5c18520f45e68cadfcae17d9113036bf89.jpg",
              "price": "₹1090",
              "judgment": "Classic Solid",
              "reasoning": "timeless Savana quality",
              "attributes": {
                "ctaUrl": "https://www.savana.com/details/solid-school-backpack-1911392",
                "visualQuery": "Solid School Backpack"
              },
              "raw": "<card title=\"Solid School Backpack\" place_id=\"3c6ae584-961e-5ef6-af1e-2bf4e05d26d1\"><badge>Classic Solid</badge><price>₹1090</price><why>timeless Savana quality</why><visual query=\"Solid School Backpack\" title=\"Solid School Backpack\" place_id=\"3c6ae584-961e-5ef6-af1e-2bf4e05d26d1\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/48fe0a5c18520f45e68cadfcae17d9113036bf89.jpg\"/><cta>https://www.savana.com/details/solid-school-backpack-1911392</cta></card>"
            },
            {
              "id": "entity-20",
              "type": "generic",
              "title": "VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L",
              "subtitle": "Vaya",
              "location": "Vaya",
              "externalId": "d18f5165-9548-5b38-83d9-f1dc0d91cb2f",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/03/3da5d416cb94e2486d2f7daf6582e3f34f482a0c.jpg",
              "price": "₹3141",
              "judgment": "Bold Look",
              "reasoning": "purple colourblock, 26L",
              "attributes": {
                "ctaUrl": "https://www.myntra.com/backpacks/vaya/vaya-prodygy-unisex-purple-colourblocked-teenagers-school-bag-26l/36269850/buy",
                "visualQuery": "VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L"
              },
              "raw": "<card title=\"VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L\" place_id=\"d18f5165-9548-5b38-83d9-f1dc0d91cb2f\"><badge>Bold Look</badge><price>₹3141</price><why>purple colourblock, 26L</why><visual query=\"VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L\" title=\"VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L\" place_id=\"d18f5165-9548-5b38-83d9-f1dc0d91cb2f\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/03/3da5d416cb94e2486d2f7daf6582e3f34f482a0c.jpg\"/><cta>https://www.myntra.com/backpacks/vaya/vaya-prodygy-unisex-purple-colourblocked-teenagers-school-bag-26l/36269850/buy</cta></card>"
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "entity-11",
                  "type": "generic",
                  "title": "URBAN CARRIER Unisex School Backpack",
                  "subtitle": "URBAN CARRIER",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/05/c5e7e583f3398493714c14b35807c1c5cb9ed6b1.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹562",
                    "placeId": "16b187ce-ad03-5079-8897-0075cf76af25",
                    "judgment": "Budget Pick"
                  }
                },
                {
                  "id": "entity-12",
                  "type": "generic",
                  "title": "Solid School Backpack",
                  "subtitle": "Savana",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/ce0fc264ddb8fb493e03db5930c68e3a26c853e3.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹763",
                    "placeId": "1474304e-61db-5fe9-b521-9cb5a868d830",
                    "judgment": "Value Pick"
                  }
                },
                {
                  "id": "entity-13",
                  "type": "generic",
                  "title": "Solid School Backpack",
                  "subtitle": "Savana",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/67fcd9dc67ceb311ae64d8fdf8b567f93d919ac8.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹817",
                    "placeId": "0b487109-f813-59fe-95be-b674816820fe",
                    "judgment": "Solid Choice",
                    "signal": "Classic"
                  }
                },
                {
                  "id": "entity-14",
                  "type": "generic",
                  "title": "Patched School Backpack",
                  "subtitle": "Savana",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/b09bcf2d699d77d268ce627c63d88cb1d080cbd0.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹1011",
                    "placeId": "91267493-fccb-53cf-bd81-913aa66380f6",
                    "judgment": "Trendy Style"
                  }
                },
                {
                  "id": "entity-15",
                  "type": "generic",
                  "title": "Skybags Unisex Manga Anime Black School Backpack - 27L",
                  "subtitle": "Skybags",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/63ca4d3b2313a6e9e3446c189e190c97c34bbd2a.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹1470",
                    "placeId": "31755b71-12ee-54e8-9929-6f6aa246b249",
                    "judgment": "Anime Fun"
                  }
                },
                {
                  "id": "entity-16",
                  "type": "generic",
                  "title": "Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke",
                  "subtitle": "Skybags",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/76e9143a8715e0f45201d6d0dc01817f0654b1c6.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹1470",
                    "placeId": "33e37428-32e3-527f-b156-b4fb53b47c10",
                    "judgment": "Colorful Option"
                  }
                },
                {
                  "id": "entity-17",
                  "type": "generic",
                  "title": "Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L",
                  "subtitle": "Skybags",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/7f1efe4750c2fcb15cab81dab6654a88b58c4279.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹2016",
                    "placeId": "dcc6b46a-5d92-5690-853a-6717267fd726",
                    "judgment": "Premium Feature"
                  }
                },
                {
                  "id": "entity-18",
                  "type": "generic",
                  "title": "Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch",
                  "subtitle": "Skybags",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/12/6cc8c7ce881a20f7ddc1243c0699bb0ca77dbd5c.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹2688",
                    "placeId": "f766f734-ead0-55ad-bccc-7fcb6862dfc7",
                    "judgment": "Tiffin Ready"
                  }
                },
                {
                  "id": "entity-19",
                  "type": "generic",
                  "title": "Solid School Backpack",
                  "subtitle": "Savana",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/48fe0a5c18520f45e68cadfcae17d9113036bf89.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹1090",
                    "placeId": "3c6ae584-961e-5ef6-af1e-2bf4e05d26d1",
                    "judgment": "Classic Solid",
                    "signal": "Classic"
                  }
                },
                {
                  "id": "entity-20",
                  "type": "generic",
                  "title": "VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L",
                  "subtitle": "Vaya",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/03/3da5d416cb94e2486d2f7daf6582e3f34f482a0c.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹3141",
                    "placeId": "d18f5165-9548-5b38-83d9-f1dc0d91cb2f",
                    "judgment": "Bold Look"
                  }
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-17",
          "hs-19"
        ],
        "confidence": "high",
        "enterDuration": 1150,
        "holdDuration": 2900,
        "exitDuration": 300,
        "traceTiming": {
          "start": 3974.5,
          "end": 5910
        }
      },
      {
        "id": "list-complete",
        "visibility": "status",
        "narration": "Here's the full spread.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Show me more under ₹1000",
        "Same styles in different colors",
        "Find matching pencil cases",
        "Show me more like this"
      ],
      "kind": "list",
      "headline": "Here are some great school backpack options for both boys and girls, ranging from budget-friendly to feature-rich designs:",
      "items": [
        {
          "id": "entity-11",
          "type": "generic",
          "title": "URBAN CARRIER Unisex School Backpack",
          "subtitle": "URBAN CARRIER",
          "location": "URBAN CARRIER",
          "externalId": "16b187ce-ad03-5079-8897-0075cf76af25",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/05/c5e7e583f3398493714c14b35807c1c5cb9ed6b1.jpg",
          "price": "₹562",
          "judgment": "Budget Pick",
          "reasoning": "affordable and durable for daily use",
          "attributes": {
            "ctaUrl": "https://www.myntra.com/backpacks/urban+carrier/urban-carrier-unisex-school--backpack/32496179/buy",
            "visualQuery": "URBAN CARRIER Unisex School Backpack"
          },
          "raw": "<card title=\"URBAN CARRIER Unisex School Backpack\" place_id=\"16b187ce-ad03-5079-8897-0075cf76af25\"><badge>Budget Pick</badge><price>₹562</price><why>affordable and durable for daily use</why><visual query=\"URBAN CARRIER Unisex School Backpack\" title=\"URBAN CARRIER Unisex School Backpack\" place_id=\"16b187ce-ad03-5079-8897-0075cf76af25\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/05/c5e7e583f3398493714c14b35807c1c5cb9ed6b1.jpg\"/><cta>https://www.myntra.com/backpacks/urban+carrier/urban-carrier-unisex-school--backpack/32496179/buy</cta></card>"
        },
        {
          "id": "entity-12",
          "type": "generic",
          "title": "Solid School Backpack",
          "subtitle": "Savana",
          "location": "Savana",
          "externalId": "1474304e-61db-5fe9-b521-9cb5a868d830",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/ce0fc264ddb8fb493e03db5930c68e3a26c853e3.jpg",
          "price": "₹763",
          "judgment": "Value Pick",
          "reasoning": "lightweight with great capacity",
          "attributes": {
            "ctaUrl": "https://www.savana.com/details/solid-school-backpack-1887622",
            "visualQuery": "Solid School Backpack"
          },
          "raw": "<card title=\"Solid School Backpack\" place_id=\"1474304e-61db-5fe9-b521-9cb5a868d830\"><badge>Value Pick</badge><price>₹763</price><why>lightweight with great capacity</why><visual query=\"Solid School Backpack\" title=\"Solid School Backpack\" place_id=\"1474304e-61db-5fe9-b521-9cb5a868d830\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/ce0fc264ddb8fb493e03db5930c68e3a26c853e3.jpg\"/><cta>https://www.savana.com/details/solid-school-backpack-1887622</cta></card>"
        },
        {
          "id": "entity-13",
          "type": "generic",
          "title": "Solid School Backpack",
          "subtitle": "Savana",
          "location": "Savana",
          "externalId": "0b487109-f813-59fe-95be-b674816820fe",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/67fcd9dc67ceb311ae64d8fdf8b567f93d919ac8.jpg",
          "price": "₹817",
          "judgment": "Solid Choice",
          "reasoning": "classic design, reliable brand",
          "attributes": {
            "ctaUrl": "https://www.savana.com/details/solid-school-backpack-1893232",
            "visualQuery": "Solid School Backpack"
          },
          "raw": "<card title=\"Solid School Backpack\" place_id=\"0b487109-f813-59fe-95be-b674816820fe\"><badge>Solid Choice</badge><price>₹817</price><why>classic design, reliable brand</why><visual query=\"Solid School Backpack\" title=\"Solid School Backpack\" place_id=\"0b487109-f813-59fe-95be-b674816820fe\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/67fcd9dc67ceb311ae64d8fdf8b567f93d919ac8.jpg\"/><cta>https://www.savana.com/details/solid-school-backpack-1893232</cta></card>"
        },
        {
          "id": "entity-14",
          "type": "generic",
          "title": "Patched School Backpack",
          "subtitle": "Savana",
          "location": "Savana",
          "externalId": "91267493-fccb-53cf-bd81-913aa66380f6",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/b09bcf2d699d77d268ce627c63d88cb1d080cbd0.jpg",
          "price": "₹1011",
          "judgment": "Trendy Style",
          "reasoning": "patched design for personality",
          "attributes": {
            "ctaUrl": "https://www.savana.com/details/patched-school-backpack-1887692",
            "visualQuery": "Patched School Backpack"
          },
          "raw": "<card title=\"Patched School Backpack\" place_id=\"91267493-fccb-53cf-bd81-913aa66380f6\"><badge>Trendy Style</badge><price>₹1011</price><why>patched design for personality</why><visual query=\"Patched School Backpack\" title=\"Patched School Backpack\" place_id=\"91267493-fccb-53cf-bd81-913aa66380f6\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/b09bcf2d699d77d268ce627c63d88cb1d080cbd0.jpg\"/><cta>https://www.savana.com/details/patched-school-backpack-1887692</cta></card>"
        },
        {
          "id": "entity-15",
          "type": "generic",
          "title": "Skybags Unisex Manga Anime Black School Backpack - 27L",
          "subtitle": "Skybags",
          "location": "Skybags",
          "externalId": "31755b71-12ee-54e8-9929-6f6aa246b249",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/63ca4d3b2313a6e9e3446c189e190c97c34bbd2a.jpg",
          "price": "₹1470",
          "judgment": "Anime Fun",
          "reasoning": "manga print, 3 compartments",
          "attributes": {
            "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-black-school-backpack-with-3-compartments--front-pocket---27l/39487174/buy",
            "visualQuery": "Skybags Unisex Manga Anime Black School Backpack - 27L"
          },
          "raw": "<card title=\"Skybags Unisex Manga Anime Black School Backpack - 27L\" place_id=\"31755b71-12ee-54e8-9929-6f6aa246b249\"><badge>Anime Fun</badge><price>₹1470</price><why>manga print, 3 compartments</why><visual query=\"Skybags Unisex Manga Anime Black School Backpack - 27L\" title=\"Skybags Unisex Manga Anime Black School Backpack - 27L\" place_id=\"31755b71-12ee-54e8-9929-6f6aa246b249\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/63ca4d3b2313a6e9e3446c189e190c97c34bbd2a.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-black-school-backpack-with-3-compartments--front-pocket---27l/39487174/buy</cta></card>"
        },
        {
          "id": "entity-16",
          "type": "generic",
          "title": "Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke",
          "subtitle": "Skybags",
          "location": "Skybags",
          "externalId": "33e37428-32e3-527f-b156-b4fb53b47c10",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/76e9143a8715e0f45201d6d0dc01817f0654b1c6.jpg",
          "price": "₹1470",
          "judgment": "Colorful Option",
          "reasoning": "teal anime design, front pocket",
          "attributes": {
            "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-teal-school-backpack-with-3-compartments--front-pocket---27l/39487175/buy",
            "visualQuery": "Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke"
          },
          "raw": "<card title=\"Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke\" place_id=\"33e37428-32e3-527f-b156-b4fb53b47c10\"><badge>Colorful Option</badge><price>₹1470</price><why>teal anime design, front pocket</why><visual query=\"Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke\" title=\"Skybags Unisex Manga Anime Teal School Backpack with 3 Compartments & Front Pocke\" place_id=\"33e37428-32e3-527f-b156-b4fb53b47c10\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/76e9143a8715e0f45201d6d0dc01817f0654b1c6.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-manga-anime-teal-school-backpack-with-3-compartments--front-pocket---27l/39487175/buy</cta></card>"
        },
        {
          "id": "entity-17",
          "type": "generic",
          "title": "Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L",
          "subtitle": "Skybags",
          "location": "Skybags",
          "externalId": "dcc6b46a-5d92-5690-853a-6717267fd726",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/7f1efe4750c2fcb15cab81dab6654a88b58c4279.jpg",
          "price": "₹2016",
          "judgment": "Premium Feature",
          "reasoning": "rain cover, 34L capacity",
          "attributes": {
            "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-kenshi-stealth-black-school-backpack-with-3-compartments--rain-cover---34l/39487183/buy",
            "visualQuery": "Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L"
          },
          "raw": "<card title=\"Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L\" place_id=\"dcc6b46a-5d92-5690-853a-6717267fd726\"><badge>Premium Feature</badge><price>₹2016</price><why>rain cover, 34L capacity</why><visual query=\"Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L\" title=\"Skybags Unisex Kenshi Stealth Black School Backpack with 3 Compartments & Rain Cover - 34L\" place_id=\"dcc6b46a-5d92-5690-853a-6717267fd726\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/04/7f1efe4750c2fcb15cab81dab6654a88b58c4279.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-kenshi-stealth-black-school-backpack-with-3-compartments--rain-cover---34l/39487183/buy</cta></card>"
        },
        {
          "id": "entity-18",
          "type": "generic",
          "title": "Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch",
          "subtitle": "Skybags",
          "location": "Skybags",
          "externalId": "f766f734-ead0-55ad-bccc-7fcb6862dfc7",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/12/6cc8c7ce881a20f7ddc1243c0699bb0ca77dbd5c.jpg",
          "price": "₹2688",
          "judgment": "Tiffin Ready",
          "reasoning": "insulated pouch included",
          "attributes": {
            "ctaUrl": "https://www.myntra.com/backpacks/skybags/skybags-unisex-sizzler-pro-green-school-backpack-with-insulated-tiffin-pouch---39l/39487195/buy",
            "visualQuery": "Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch"
          },
          "raw": "<card title=\"Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch\" place_id=\"f766f734-ead0-55ad-bccc-7fcb6862dfc7\"><badge>Tiffin Ready</badge><price>₹2688</price><why>insulated pouch included</why><visual query=\"Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch\" title=\"Skybags Unisex Sizzler Pro Green School Backpack with Insulated Tiffin Pouch\" place_id=\"f766f734-ead0-55ad-bccc-7fcb6862dfc7\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/12/6cc8c7ce881a20f7ddc1243c0699bb0ca77dbd5c.jpg\"/><cta>https://www.myntra.com/backpacks/skybags/skybags-unisex-sizzler-pro-green-school-backpack-with-insulated-tiffin-pouch---39l/39487195/buy</cta></card>"
        },
        {
          "id": "entity-19",
          "type": "generic",
          "title": "Solid School Backpack",
          "subtitle": "Savana",
          "location": "Savana",
          "externalId": "3c6ae584-961e-5ef6-af1e-2bf4e05d26d1",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/48fe0a5c18520f45e68cadfcae17d9113036bf89.jpg",
          "price": "₹1090",
          "judgment": "Classic Solid",
          "reasoning": "timeless Savana quality",
          "attributes": {
            "ctaUrl": "https://www.savana.com/details/solid-school-backpack-1911392",
            "visualQuery": "Solid School Backpack"
          },
          "raw": "<card title=\"Solid School Backpack\" place_id=\"3c6ae584-961e-5ef6-af1e-2bf4e05d26d1\"><badge>Classic Solid</badge><price>₹1090</price><why>timeless Savana quality</why><visual query=\"Solid School Backpack\" title=\"Solid School Backpack\" place_id=\"3c6ae584-961e-5ef6-af1e-2bf4e05d26d1\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/13/48fe0a5c18520f45e68cadfcae17d9113036bf89.jpg\"/><cta>https://www.savana.com/details/solid-school-backpack-1911392</cta></card>"
        },
        {
          "id": "entity-20",
          "type": "generic",
          "title": "VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L",
          "subtitle": "Vaya",
          "location": "Vaya",
          "externalId": "d18f5165-9548-5b38-83d9-f1dc0d91cb2f",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/03/3da5d416cb94e2486d2f7daf6582e3f34f482a0c.jpg",
          "price": "₹3141",
          "judgment": "Bold Look",
          "reasoning": "purple colourblock, 26L",
          "attributes": {
            "ctaUrl": "https://www.myntra.com/backpacks/vaya/vaya-prodygy-unisex-purple-colourblocked-teenagers-school-bag-26l/36269850/buy",
            "visualQuery": "VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L"
          },
          "raw": "<card title=\"VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L\" place_id=\"d18f5165-9548-5b38-83d9-f1dc0d91cb2f\"><badge>Bold Look</badge><price>₹3141</price><why>purple colourblock, 26L</why><visual query=\"VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L\" title=\"VAYA PRODYGY Unisex Purple Colourblocked School Bag 26L\" place_id=\"d18f5165-9548-5b38-83d9-f1dc0d91cb2f\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2026/08/03/3da5d416cb94e2486d2f7daf6582e3f34f482a0c.jpg\"/><cta>https://www.myntra.com/backpacks/vaya/vaya-prodygy-unisex-purple-colourblocked-teenagers-school-bag-26l/36269850/buy</cta></card>"
        }
      ]
    },
    "classification": {
      "prompt": "show backpacks for school for male and female",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": true,
      "outputShape": "place_card",
      "archetype": "list",
      "confidence": "high",
      "signals": [
        "Multiple peers with no ranking signal.",
        "10 comparable entities, 0 supporting block(s).",
        "2 search/retrieval call(s)."
      ],
      "entityCount": 10
    },
    "requirements": {
      "requestedAttributes": [],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": []
    },
    "metadata": {
      "toolSequence": [
        "ProductSearch",
        "ProductSearch"
      ],
      "skills": [
        "default",
        "fashion",
        "travel"
      ],
      "latencyMs": 14045,
      "entityCount": 10,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-11",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-20",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-22",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-24",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-26",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 25,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 13180,
      "list": {
        "rawResultCount": 20,
        "resolvedListCount": 10,
        "visibleListCount": 10,
        "narrationCount": 10,
        "imagesAvailable": 10,
        "itemSource": "discovery",
        "themeCount": 0
      },
      "captureId": "q01",
      "captureLabel": "School Backpacks"
    }
  },
  {
    "id": "harness-q02",
    "archetype": "structured_no_image",
    "prompt": "How do I make Thavala Dosai? Give me the full recipe including the rice-lentil ratio, fermentation time, and cooking technique in the traditional bronze pot.",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q02",
    "thinkingPasses": [
      {
        "id": "pass-acknowledge",
        "visibility": "canvas_value",
        "narration": "Got it — let's see what's around.",
        "valueType": "intent",
        "payload": {
          "chips": [
            "Thavala Dosai"
          ]
        },
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1300,
        "exitDuration": 250
      },
      {
        "id": "pass-1-research-0",
        "visibility": "canvas_value",
        "narration": "Running a few checks in parallel",
        "valueType": "sources",
        "payload": {
          "sources": [
            {
              "label": "Youreverydaycook",
              "kind": "web",
              "domain": "youreverydaycook.com"
            },
            {
              "label": "Jeyashriskitchen",
              "kind": "web",
              "domain": "jeyashriskitchen.com"
            },
            {
              "label": "Subbuskitchen",
              "kind": "web",
              "domain": "subbuskitchen.com"
            },
            {
              "label": "Everydayvegcooking",
              "kind": "web",
              "domain": "everydayvegcooking.com"
            }
          ],
          "sourceCount": 4,
          "searchCount": 2
        },
        "sourceEventIds": [
          "hs-14",
          "hs-16"
        ],
        "sourceSpanIds": [
          "6572ccc9-2460-4a49-acad-c514838940f6",
          "6f411a63-8808-4528-b8d8-9c2838e30f88"
        ],
        "confidence": "high",
        "enterDuration": 750,
        "holdDuration": 2700,
        "exitDuration": 300,
        "traceTiming": {
          "start": 6305.5,
          "end": 10718.5
        }
      },
      {
        "id": "pass-1-research-1",
        "visibility": "canvas_value",
        "narration": "Reading the details on youreverydaycook.com",
        "valueType": "sources",
        "payload": {
          "sources": [
            {
              "label": "Youreverydaycook",
              "kind": "web",
              "domain": "youreverydaycook.com"
            },
            {
              "label": "Jeyashriskitchen",
              "kind": "web",
              "domain": "jeyashriskitchen.com"
            },
            {
              "label": "Subbuskitchen",
              "kind": "web",
              "domain": "subbuskitchen.com"
            },
            {
              "label": "Everydayvegcooking",
              "kind": "web",
              "domain": "everydayvegcooking.com"
            }
          ],
          "sourceCount": 4,
          "searchCount": 3
        },
        "sourceEventIds": [
          "hs-22"
        ],
        "sourceSpanIds": [
          "958002f3-aff1-48d1-a6ec-b7fab5bf7408"
        ],
        "confidence": "high",
        "enterDuration": 750,
        "holdDuration": 2700,
        "exitDuration": 300,
        "traceTiming": {
          "start": 15387.5,
          "end": 16199.5
        }
      },
      {
        "id": "pass-1-research-2",
        "visibility": "canvas_value",
        "narration": "Checking vengala paanai urad dal rice ratio",
        "valueType": "sources",
        "payload": {
          "sources": [
            {
              "label": "Youreverydaycook",
              "kind": "web",
              "domain": "youreverydaycook.com"
            },
            {
              "label": "Jeyashriskitchen",
              "kind": "web",
              "domain": "jeyashriskitchen.com"
            },
            {
              "label": "Subbuskitchen",
              "kind": "web",
              "domain": "subbuskitchen.com"
            },
            {
              "label": "Everydayvegcooking",
              "kind": "web",
              "domain": "everydayvegcooking.com"
            }
          ],
          "sourceCount": 4,
          "searchCount": 4
        },
        "sourceEventIds": [
          "hs-28"
        ],
        "sourceSpanIds": [
          "130b6da6-9e5d-4e8d-804f-e3ca3457cb72"
        ],
        "confidence": "high",
        "enterDuration": 750,
        "holdDuration": 2700,
        "exitDuration": 300,
        "traceTiming": {
          "start": 20207.5,
          "end": 20514.5
        }
      },
      {
        "id": "pass-synthesis",
        "visibility": "canvas_value",
        "narration": "Turning the research into a step-by-step recipe",
        "valueType": "synthesis_structure",
        "payload": {
          "sections": [
            "Base Batter",
            "For Tempering",
            "Soak & Grind",
            "Fermentation",
            "Cooking in Vengala Paanai",
            "Achieving Crispiness"
          ]
        },
        "confidence": "high",
        "enterDuration": 700,
        "holdDuration": 2400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "What chutney pairs best?",
        "Can I make it gluten-free?",
        "Show me a video tutorial",
        "How to clean a bronze pot?"
      ],
      "supporting": [
        {
          "role": "attribute",
          "title": "Base Batter",
          "lines": [
            "1 cup idli rava (coarse rice semolina)",
            "1/4 cup urad dal",
            "1/4 cup chana dal",
            "1 tsp cumin seeds",
            "1 tsp red chilies",
            "1/2 tsp asafoetida",
            "Salt to taste"
          ],
          "raw": "<card title=\"Base Batter\"><bullets><point>1 cup idli rava (coarse rice semolina)</point><point>1/4 cup urad dal</point><point>1/4 cup chana dal</point><point>1 tsp cumin seeds</point><point>1 tsp red chilies</point><point>1/2 tsp asafoetida</point><point>Salt to taste</point></bullets></card>"
        },
        {
          "role": "attribute",
          "title": "For Tempering",
          "lines": [
            "2 tbsp sesame or coconut oil",
            "1 tsp mustard seeds",
            "1 tsp split urad dal",
            "1 tsp chana dal",
            "2-3 dried red chilies",
            "4-5 curry leaves"
          ],
          "raw": "<card title=\"For Tempering\"><bullets><point>2 tbsp sesame or coconut oil</point><point>1 tsp mustard seeds</point><point>1 tsp split urad dal</point><point>1 tsp chana dal</point><point>2-3 dried red chilies</point><point>4-5 curry leaves</point></bullets></card>"
        },
        {
          "role": "attribute",
          "title": "Soak & Grind",
          "lines": [
            "Soak idli rava, urad dal, and chana dal separately for 3–4 hours.",
            "Grind urad dal and chana dal coarsely with minimal water.",
            "Mix soaked, drained idli rava into the ground batter."
          ],
          "raw": "<card title=\"Soak & Grind\"><bullets><point>Soak idli rava, urad dal, and chana dal separately for 3–4 hours.</point><point>Grind urad dal and chana dal coarsely with minimal water.</point><point>Mix soaked, drained idli rava into the ground batter.</point></bullets><visual query=\"\" title=\"Soak & Grind\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/aigc/soaking.webp\"/></card>"
        },
        {
          "role": "attribute",
          "title": "Fermentation",
          "lines": [
            "Rest 3 hours — no true fermentation needed.",
            "Consistency: thick, pourable but not runny.",
            "Do not over-grind — coarse texture is key for crispiness."
          ],
          "raw": "<card title=\"Fermentation\"><bullets><point>Rest 3 hours — no true fermentation needed.</point><point>Consistency: thick, pourable but not runny.</point><point>Do not over-grind — coarse texture is key for crispiness.</point></bullets><visual query=\"\" title=\"Fermentation\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/aigc/batter.webp\"/></card>"
        },
        {
          "role": "attribute",
          "title": "Cooking in Vengala Paanai",
          "lines": [
            "Heat the bronze pot on medium-high heat.",
            "First dosai needs generous oil to season the pot.",
            "Pour batter into the center; do not spread — let it cook thick.",
            "Cover 2 minutes, then cook uncovered on low flame until golden.",
            "Flip and cook the other side 1–2 minutes."
          ],
          "raw": "<card title=\"Cooking in Vengala Paanai\"><bullets><point>Heat the bronze pot on medium-high heat.</point><point>First dosai needs generous oil to season the pot.</point><point>Pour batter into the center; do not spread — let it cook thick.</point><point>Cover 2 minutes, then cook uncovered on low flame until golden.</point><point>Flip and cook the other side 1–2 minutes.</point></bullets><visual query=\"\" title=\"Cooking in Vengala Paanai\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/aigc/cooking.webp\"/></card>"
        },
        {
          "role": "supporting",
          "title": "Achieving Crispiness",
          "lines": [
            "Use a heavy-bottomed bronze or cast-iron pot for even heat. First dosai needs more oil to season the pot; subsequent ones release easily."
          ],
          "raw": "<card title=\"Achieving Crispiness\"><why>Use a heavy-bottomed bronze or cast-iron pot for even heat. First dosai needs more oil to season the pot; subsequent ones release easily.</why></card>"
        },
        {
          "role": "supporting",
          "title": "Golden Color & Flavor",
          "lines": [
            "Sesame oil adds traditional nutty aroma. Don't flip too early — wait for edges to lift naturally. Serve hot with coconut chutney and sambar."
          ],
          "raw": "<card title=\"Golden Color & Flavor\"><why>Sesame oil adds traditional nutty aroma. Don't flip too early — wait for edges to lift naturally. Serve hot with coconut chutney and sambar.</why></card>"
        }
      ],
      "kind": "structured",
      "headline": "Patience on low heat is the whole secret — a properly cooked Thavala Dosai should be crisp outside, soft inside, and worth the wait.",
      "columns": [
        "Group",
        "Item",
        "Detail"
      ],
      "rows": [
        [
          "Base Batter",
          "1 cup idli rava (coarse rice semolina)",
          ""
        ],
        [
          "Base Batter",
          "1/4 cup urad dal",
          ""
        ],
        [
          "Base Batter",
          "1/4 cup chana dal",
          ""
        ],
        [
          "Base Batter",
          "1 tsp cumin seeds",
          ""
        ],
        [
          "Base Batter",
          "1 tsp red chilies",
          ""
        ],
        [
          "Base Batter",
          "1/2 tsp asafoetida",
          ""
        ],
        [
          "Base Batter",
          "Salt to taste",
          ""
        ],
        [
          "For Tempering",
          "2 tbsp sesame or coconut oil",
          ""
        ],
        [
          "For Tempering",
          "1 tsp mustard seeds",
          ""
        ],
        [
          "For Tempering",
          "1 tsp split urad dal",
          ""
        ],
        [
          "For Tempering",
          "1 tsp chana dal",
          ""
        ],
        [
          "For Tempering",
          "2-3 dried red chilies",
          ""
        ],
        [
          "For Tempering",
          "4-5 curry leaves",
          ""
        ],
        [
          "Soak & Grind",
          "Soak idli rava, urad dal, and chana dal separately for 3–4 hours.",
          ""
        ],
        [
          "Soak & Grind",
          "Grind urad dal and chana dal coarsely with minimal water.",
          ""
        ],
        [
          "Soak & Grind",
          "Mix soaked, drained idli rava into the ground batter.",
          ""
        ],
        [
          "Fermentation",
          "Rest 3 hours — no true fermentation needed.",
          ""
        ],
        [
          "Fermentation",
          "Consistency",
          "thick, pourable but not runny."
        ],
        [
          "Fermentation",
          "Do not over-grind — coarse texture is key for crispiness.",
          ""
        ],
        [
          "Cooking in Vengala Paanai",
          "Heat the bronze pot on medium-high heat.",
          ""
        ],
        [
          "Cooking in Vengala Paanai",
          "First dosai needs generous oil to season the pot.",
          ""
        ],
        [
          "Cooking in Vengala Paanai",
          "Pour batter into the center; do not spread — let it cook thick.",
          ""
        ],
        [
          "Cooking in Vengala Paanai",
          "Cover 2 minutes, then cook uncovered on low flame until golden.",
          ""
        ],
        [
          "Cooking in Vengala Paanai",
          "Flip and cook the other side 1–2 minutes.",
          ""
        ],
        [
          "Achieving Crispiness",
          "Use a heavy-bottomed bronze or cast-iron pot for even heat. First dosai needs more oil to season the pot; subsequent ones release easily.",
          ""
        ],
        [
          "Golden Color & Flavor",
          "Sesame oil adds traditional nutty aroma. Don't flip too early — wait for edges to lift naturally. Serve hot with coconut chutney and sambar.",
          ""
        ]
      ]
    },
    "classification": {
      "prompt": "How do I make Thavala Dosai? Give me the full recipe including the rice-lentil ratio, fermentation time, and cooking technique in the traditional bronze pot.",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": true,
      "outputShape": "card_template",
      "archetype": "structured_no_image",
      "confidence": "low",
      "signals": [
        "Structured/numeric output (slots, schedule, table) with no peer-entity set.",
        "0 comparable entities, 7 supporting block(s).",
        "5 dimension block(s): Base Batter, For Tempering, Soak & Grind, Fermentation, Cooking in Vengala Paanai.",
        "3 search/retrieval call(s)."
      ],
      "entityCount": 0
    },
    "requirements": {
      "requestedAttributes": [],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": []
    },
    "metadata": {
      "toolSequence": [
        "WebSearch",
        "WebSearch",
        "WebFetch",
        "WebSearch"
      ],
      "skills": [
        "default",
        "food"
      ],
      "latencyMs": 35087,
      "entityCount": 0,
      "supportingCount": 7,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-11",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-20",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-24",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-26",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-29",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-30",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-31",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-32",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-33",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-34",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 30,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 33562,
      "captureId": "q02",
      "captureLabel": "Thavala Dosai Recipe"
    }
  },
  {
    "id": "harness-q03",
    "archetype": "hybrid",
    "prompt": "Build me a stay plan for Rawla Narlai in Pali district, Rajasthan — rooms, dining, culture, and how far it is from nearby attractions.",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q03",
    "thinkingPasses": [
      {
        "id": "pass-acknowledge",
        "visibility": "canvas_value",
        "narration": "Got it — let's see what's around.",
        "valueType": "intent",
        "payload": {
          "chips": [
            "Rawla Narlai",
            "Near me"
          ]
        },
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1300,
        "exitDuration": 250
      },
      {
        "id": "pass-1-discover",
        "visibility": "canvas_value",
        "narration": "Spotted 1 promising option",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "place-21",
              "type": "place",
              "title": "Rawla Narlai Luxury Heritage Hotel",
              "subtitle": "Desuri, Narlai",
              "location": "8G8M+9P5, Desuri, Narlai, Rajasthan 306703, India",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg",
              "rating": 4.4,
              "reviewCount": 1974,
              "externalId": "ChIJKQAAwOooaDkR3gxrC2IjaDE",
              "raw": {
                "place_id": "ChIJKQAAwOooaDkR3gxrC2IjaDE",
                "name": "Rawla Narlai Luxury Heritage Hotel",
                "formatted_address": "8G8M+9P5, Desuri, Narlai, Rajasthan 306703, India",
                "types": [
                  "resort_hotel",
                  "hotel",
                  "lodging"
                ],
                "rating": 4.4,
                "user_rating_count": 1974,
                "open_now": true,
                "phone": "0291 251 1510",
                "latitude": 25.3159375,
                "longitude": 73.5343125,
                "photo_url": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg"
              }
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "place-21",
                  "type": "place",
                  "title": "Rawla Narlai Luxury Heritage Hotel",
                  "subtitle": "Desuri, Narlai",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg",
                  "state": "discovered",
                  "metadata": {
                    "rating": 4.4,
                    "reviewCount": 1974,
                    "placeId": "ChIJKQAAwOooaDkR3gxrC2IjaDE"
                  }
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-12"
        ],
        "sourceSpanIds": [
          "039d352d-1e79-498e-a2fd-1313c43d70f0"
        ],
        "confidence": "high",
        "debug": {
          "narrationCount": 1,
          "visibleCandidateCount": 1,
          "canonicalCandidateCount": 1,
          "discoveryExtracted": 1,
          "finalResponseExtracted": 6,
          "entitySource": "discovery",
          "subsetSource": "trace_order",
          "imagesAvailable": 1,
          "coordinatesAvailable": 1
        },
        "enterDuration": 750,
        "holdDuration": 2700,
        "exitDuration": 300,
        "traceTiming": {
          "start": 6909.5,
          "end": 7526
        }
      },
      {
        "id": "pass-2-enrich",
        "visibility": "canvas_value",
        "narration": "Looking at the details",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "place-21",
              "type": "place",
              "title": "Rawla Narlai Luxury Heritage Hotel",
              "subtitle": "Desuri, Narlai",
              "location": "8G8M+9P5, Desuri, Narlai, Rajasthan 306703, India",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg",
              "rating": 4.4,
              "reviewCount": 1974,
              "availability": "Monday: Open 24 hours · Tuesday: Open 24 hours",
              "externalId": "ChIJKQAAwOooaDkR3gxrC2IjaDE",
              "raw": {
                "place_id": "ChIJKQAAwOooaDkR3gxrC2IjaDE",
                "name": "Rawla Narlai Luxury Heritage Hotel",
                "formatted_address": "8G8M+9P5, Desuri, Narlai, Rajasthan 306703, India",
                "types": [
                  "resort_hotel",
                  "hotel",
                  "lodging"
                ],
                "rating": 4.4,
                "user_rating_count": 1974,
                "open_now": true,
                "phone": "0291 251 1510",
                "latitude": 25.3159375,
                "longitude": 73.5343125,
                "photo_url": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg"
              }
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "place-21",
                  "type": "place",
                  "title": "Rawla Narlai Luxury Heritage Hotel",
                  "subtitle": "Desuri, Narlai",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg",
                  "state": "discovered",
                  "metadata": {
                    "rating": 4.4,
                    "reviewCount": 1974,
                    "availability": "Monday: Open 24 hours · Tuesday: Open 24 hours",
                    "placeId": "ChIJKQAAwOooaDkR3gxrC2IjaDE"
                  }
                }
              ]
            },
            {
              "type": "ENRICH_ITEMS",
              "patches": [
                {
                  "id": "place-21",
                  "data": {
                    "rating": 4.4,
                    "reviewCount": 1974,
                    "availability": "Monday: Open 24 hours · Tuesday: Open 24 hours"
                  }
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-17"
        ],
        "sourceSpanIds": [
          "8fd69807-237c-4e59-8390-9d9eb886bdba"
        ],
        "confidence": "high",
        "enterDuration": 750,
        "holdDuration": 2700,
        "exitDuration": 300,
        "traceTiming": {
          "start": 11239,
          "end": 11548.5
        }
      },
      {
        "id": "pass-3-route-locate",
        "visibility": "canvas_value",
        "narration": "Working out where this sits from Jodhpur",
        "valueType": "route",
        "payload": {
          "origin": "Jodhpur",
          "destination": "Rawla Narlai, Pali, Rajasthan",
          "stops": [],
          "eta": "2 hours 26 mins",
          "distance": "130 km",
          "geo": {
            "origin": {
              "lat": 26.2389692,
              "lng": 73.0243524,
              "label": "Jodhpur"
            },
            "destination": {
              "lat": 25.3159175,
              "lng": 73.5343918,
              "label": "Rawla Narlai"
            },
            "geometry": "endpoints"
          },
          "stage": "locate"
        },
        "confidence": "high",
        "sourceEventIds": [
          "hs-22",
          "hs-27"
        ],
        "sourceSpanIds": [
          "92755590-6270-4073-95d6-342fc75433ad",
          "5c8b29d8-23d0-4649-baaf-8a94e20d00cd"
        ],
        "enterDuration": 900,
        "holdDuration": 1500,
        "exitDuration": 250,
        "traceTiming": {
          "start": 15539,
          "end": 19784.5
        }
      },
      {
        "id": "pass-3-route-draw",
        "visibility": "canvas_value",
        "narration": "Mapping the drive from Jodhpur",
        "valueType": "route",
        "payload": {
          "origin": "Jodhpur",
          "destination": "Rawla Narlai, Pali, Rajasthan",
          "stops": [],
          "eta": "2 hours 26 mins",
          "distance": "130 km",
          "geo": {
            "origin": {
              "lat": 26.2389692,
              "lng": 73.0243524,
              "label": "Jodhpur"
            },
            "destination": {
              "lat": 25.3159175,
              "lng": 73.5343918,
              "label": "Rawla Narlai"
            },
            "geometry": "endpoints"
          },
          "stage": "route"
        },
        "confidence": "high",
        "sourceEventIds": [
          "hs-22",
          "hs-27"
        ],
        "sourceSpanIds": [
          "92755590-6270-4073-95d6-342fc75433ad",
          "5c8b29d8-23d0-4649-baaf-8a94e20d00cd"
        ],
        "enterDuration": 1400,
        "holdDuration": 1600,
        "exitDuration": 250,
        "traceTiming": {
          "start": 15539,
          "end": 19784.5
        }
      },
      {
        "id": "pass-3-route-summary",
        "visibility": "canvas_value",
        "narration": "That is about 2 hours 26 mins on the road",
        "valueType": "route",
        "payload": {
          "origin": "Jodhpur",
          "destination": "Rawla Narlai, Pali, Rajasthan",
          "stops": [],
          "eta": "2 hours 26 mins",
          "distance": "130 km",
          "geo": {
            "origin": {
              "lat": 26.2389692,
              "lng": 73.0243524,
              "label": "Jodhpur"
            },
            "destination": {
              "lat": 25.3159175,
              "lng": 73.5343918,
              "label": "Rawla Narlai"
            },
            "geometry": "endpoints"
          },
          "stage": "summary"
        },
        "confidence": "high",
        "sourceEventIds": [
          "hs-22",
          "hs-27"
        ],
        "sourceSpanIds": [
          "92755590-6270-4073-95d6-342fc75433ad",
          "5c8b29d8-23d0-4649-baaf-8a94e20d00cd"
        ],
        "enterDuration": 600,
        "holdDuration": 1900,
        "exitDuration": 300,
        "traceTiming": {
          "start": 15539,
          "end": 19784.5
        }
      },
      {
        "id": "pass-synthesis",
        "visibility": "canvas_value",
        "narration": "Building the stay plan around these details",
        "valueType": "synthesis_structure",
        "payload": {
          "sections": [
            "Options",
            "Details",
            "From Jodhpur",
            "From Udaipur"
          ]
        },
        "confidence": "high",
        "enterDuration": 700,
        "holdDuration": 2400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Check room availability for next weekend",
        "Book the stepwell dinner experience",
        "Plan a 3-day Rajasthan heritage circuit",
        "Find more heritage hotels in Rajasthan"
      ],
      "supporting": [
        {
          "role": "supporting",
          "title": "From Jodhpur",
          "lines": [
            "Scenic 130km drive through Aravalli hills via NH62 — best taken in morning or late afternoon"
          ],
          "raw": "<card title=\"From Jodhpur\"><badge>2h 27m Drive</badge><why>Scenic 130km drive through Aravalli hills via NH62 — best taken in morning or late afternoon</why></card>"
        },
        {
          "role": "supporting",
          "title": "From Udaipur",
          "lines": [
            "122km route through Rajasthan countryside — enjoy views of forts and traditional villages"
          ],
          "raw": "<card title=\"From Udaipur\"><badge>2h 26m Drive</badge><why>122km route through Rajasthan countryside — enjoy views of forts and traditional villages</why></card>"
        }
      ],
      "kind": "hybrid",
      "headline": "A truly royal escape best enjoyed October–March when the Aravallis are cool and clear — book the stepwell dinner and safari in advance for the full experience.",
      "sections": [
        {
          "title": "Options",
          "response": {
            "kind": "entity_rail",
            "headline": "The options",
            "entities": [
              {
                "id": "entity-27",
                "type": "generic",
                "title": "Rawla Narlai Luxury Heritage Hotel",
                "subtitle": "Desuri, Narlai",
                "location": "8G8M+9P5, Desuri, Narlai, Rajasthan 306703, India",
                "externalId": "ChIJKQAAwOooaDkR3gxrC2IjaDE",
                "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg",
                "rating": 4.4,
                "reviewCount": 1974,
                "judgment": "Heritage Gem",
                "reasoning": "17th-century stepwell, leopard safaris, and candlelit dinners in a royal Aravalli retreat",
                "attributes": {
                  "ctaUrl": "https://maps.google.com/?cid=3560134409441709278",
                  "phone": "0291 251 1510"
                },
                "raw": "<card title=\"Rawla Narlai Luxury Heritage Hotel\" place_id=\"ChIJKQAAwOooaDkR3gxrC2IjaDE\"><badge>Heritage Gem</badge><rating>4.4★ (1974 Reviews)</rating><why>17th-century stepwell, leopard safaris, and candlelit dinners in a royal Aravalli retreat</why><visual query=\"\" title=\"Rawla Narlai Luxury Heritage Hotel\" place_id=\"ChIJKQAAwOooaDkR3gxrC2IjaDE\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rawlanarlai1.jpg\"/><cta>https://maps.google.com/?cid=3560134409441709278</cta><phone>0291 251 1510</phone></card>"
              },
              {
                "id": "entity-28",
                "type": "generic",
                "title": "Heritage Rooms",
                "rating": 4.4,
                "judgment": "Royal Comfort",
                "reasoning": "Authentic Rajput architecture with modern amenities, carved wooden furniture, and courtyard views",
                "attributes": {},
                "raw": "<card title=\"Heritage Rooms\"><badge>Royal Comfort</badge><rating>4.4★</rating><why>Authentic Rajput architecture with modern amenities, carved wooden furniture, and courtyard views</why></card>"
              },
              {
                "id": "entity-29",
                "type": "generic",
                "title": "Deluxe Suites",
                "rating": 4.5,
                "judgment": "Luxury Stay",
                "reasoning": "Spacious suites with private balconies, royal decor, and enhanced privacy for families or couples",
                "attributes": {},
                "raw": "<card title=\"Deluxe Suites\"><badge>Luxury Stay</badge><rating>4.5★</rating><why>Spacious suites with private balconies, royal decor, and enhanced privacy for families or couples</why></card>"
              },
              {
                "id": "entity-30",
                "type": "generic",
                "title": "Royal Villa",
                "rating": 4.6,
                "judgment": "Ultimate Privacy",
                "reasoning": "Private villa with dedicated butler, garden access, and exclusive royal treatment",
                "attributes": {},
                "raw": "<card title=\"Royal Villa\"><badge>Ultimate Privacy</badge><rating>4.6★</rating><why>Private villa with dedicated butler, garden access, and exclusive royal treatment</why></card>"
              },
              {
                "id": "entity-31",
                "type": "generic",
                "title": "Stepwell Dinner",
                "rating": 4.8,
                "judgment": "Unique Dining",
                "reasoning": "Candlelit dinner in a 400-year-old stepwell, served by bullock cart — an unforgettable royal experience",
                "attributes": {},
                "raw": "<card title=\"Stepwell Dinner\"><badge>Unique Dining</badge><rating>4.8★</rating><why>Candlelit dinner in a 400-year-old stepwell, served by bullock cart — an unforgettable royal experience</why></card>"
              },
              {
                "id": "entity-32",
                "type": "generic",
                "title": "Heritage Restaurant",
                "rating": 4.5,
                "judgment": "Royal Cuisine",
                "reasoning": "Authentic Rajasthani thali, royal feasts, and modern Indian dishes in a heritage setting",
                "attributes": {},
                "raw": "<card title=\"Heritage Restaurant\"><badge>Royal Cuisine</badge><rating>4.5★</rating><why>Authentic Rajasthani thali, royal feasts, and modern Indian dishes in a heritage setting</why></card>"
              }
            ]
          }
        },
        {
          "title": "Details",
          "response": {
            "kind": "structured",
            "headline": "Details",
            "columns": [
              "Group",
              "Item",
              "Detail"
            ],
            "rows": [
              [
                "From Jodhpur",
                "Scenic 130km drive through Aravalli hills via NH62 — best taken in morning or late afternoon",
                ""
              ],
              [
                "From Udaipur",
                "122km route through Rajasthan countryside — enjoy views of forts and traditional villages",
                ""
              ]
            ]
          }
        }
      ]
    },
    "classification": {
      "prompt": "Build me a stay plan for Rawla Narlai in Pali district, Rajasthan — rooms, dining, culture, and how far it is from nearby attractions.",
      "hasImages": true,
      "hasMapSignals": true,
      "hasStructuredData": false,
      "outputShape": "place_card",
      "archetype": "hybrid",
      "confidence": "medium",
      "signals": [
        "Peer entities plus real route/distance tool output — more than one output form.",
        "6 comparable entities, 2 supporting block(s).",
        "1 search/retrieval call(s).",
        "1 enrichment call(s).",
        "Route/map signals present."
      ],
      "entityCount": 6
    },
    "requirements": {
      "requestedAttributes": [
        "distance"
      ],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": [
        "how far"
      ]
    },
    "metadata": {
      "toolSequence": [
        "PlaceSearch",
        "PlaceDetails",
        "GetRoute",
        "GetRoute"
      ],
      "skills": [
        "default",
        "travel"
      ],
      "latencyMs": 36241,
      "entityCount": 6,
      "supportingCount": 2,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-11",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-20",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-24",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-26",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-28",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-29",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-30",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-31",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-32",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-33",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 29,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 34714,
      "captureId": "q03",
      "captureLabel": "Rawla Narlai Stay Plan"
    }
  },
  {
    "id": "harness-q04",
    "archetype": "list",
    "prompt": "Indoor board games and card games. Show products directly. Do not ask questions.",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q04",
    "thinkingPasses": [
      {
        "id": "list-acknowledge",
        "visibility": "canvas_value",
        "narration": "On it — having a look around.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1300,
        "exitDuration": 250,
        "valueType": "intent",
        "payload": {
          "chips": [
            "Indoor",
            "Board"
          ]
        }
      },
      {
        "id": "list-found",
        "visibility": "canvas_value",
        "narration": "Found 4 options worth a look",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-37",
              "type": "generic",
              "title": "Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles",
              "subtitle": "Nestasia",
              "location": "Nestasia",
              "externalId": "b9914061-177e-5f3f-9404-cb08ce55edc6",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/362e90d0640a70ac524da8a26a67be8e1a043345.jpg",
              "price": "₹1590",
              "judgment": "Wooden Ludo Solitaire 2-in-1 Game",
              "reasoning": "Classic tabletop fun",
              "attributes": {
                "ctaUrl": "https://nestasia.in/products/wooden-ludo-solitaire-2-in-1-game-with-glass-marbles",
                "visualQuery": "Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles"
              },
              "raw": "<card title=\"Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles\" place_id=\"b9914061-177e-5f3f-9404-cb08ce55edc6\"><badge>Wooden Ludo Solitaire 2-in-1 Game</badge><price>₹1590</price><why>Classic tabletop fun</why><visual query=\"Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles\" title=\"Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles\" place_id=\"b9914061-177e-5f3f-9404-cb08ce55edc6\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/362e90d0640a70ac524da8a26a67be8e1a043345.jpg\"/><cta>https://nestasia.in/products/wooden-ludo-solitaire-2-in-1-game-with-glass-marbles</cta></card>"
            },
            {
              "id": "entity-38",
              "type": "generic",
              "title": "Playing Cards – Backwaters Deck",
              "subtitle": "The Confetti Tree",
              "location": "The Confetti Tree",
              "externalId": "9ab98e5a-e1b1-5807-a235-54d887e80b60",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/1afe4c7873c779097ceae05d2b2c6279e55b7d59.jpg",
              "price": "₹1077",
              "judgment": "Playing Cards – Backwaters Deck",
              "reasoning": "Premium coastal design",
              "attributes": {
                "ctaUrl": "https://ikiru.in/products/playing-cards-backwaters-deck",
                "visualQuery": "Playing Cards – Backwaters Deck"
              },
              "raw": "<card title=\"Playing Cards – Backwaters Deck\" place_id=\"9ab98e5a-e1b1-5807-a235-54d887e80b60\"><badge>Playing Cards – Backwaters Deck</badge><price>₹1077</price><why>Premium coastal design</why><visual query=\"Playing Cards – Backwaters Deck\" title=\"Playing Cards – Backwaters Deck\" place_id=\"9ab98e5a-e1b1-5807-a235-54d887e80b60\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/1afe4c7873c779097ceae05d2b2c6279e55b7d59.jpg\"/><cta>https://ikiru.in/products/playing-cards-backwaters-deck</cta></card>"
            },
            {
              "id": "entity-39",
              "type": "generic",
              "title": "Playing Cards Set Of 2 in Wooden Display Box",
              "subtitle": "Nestasia",
              "location": "Nestasia",
              "externalId": "17dbac1f-0a86-5ba9-8f5b-9f844bc5df7e",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/f465a8ee2799588aa219f91dd503fe579d28befe.jpg",
              "price": "₹760",
              "judgment": "Playing Cards Set Of 2 in Wooden Box",
              "reasoning": "Elegant display",
              "attributes": {
                "ctaUrl": "https://nestasia.in/products/playing-cards-set-of-2-in-wooden-display-box",
                "visualQuery": "Playing Cards Set Of 2 in Wooden Display Box"
              },
              "raw": "<card title=\"Playing Cards Set Of 2 in Wooden Display Box\" place_id=\"17dbac1f-0a86-5ba9-8f5b-9f844bc5df7e\"><badge>Playing Cards Set Of 2 in Wooden Box</badge><price>₹760</price><why>Elegant display</why><visual query=\"Playing Cards Set Of 2 in Wooden Display Box\" title=\"Playing Cards Set Of 2 in Wooden Display Box\" place_id=\"17dbac1f-0a86-5ba9-8f5b-9f844bc5df7e\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/f465a8ee2799588aa219f91dd503fe579d28befe.jpg\"/><cta>https://nestasia.in/products/playing-cards-set-of-2-in-wooden-display-box</cta></card>"
            },
            {
              "id": "entity-40",
              "type": "generic",
              "title": "Wooden Playing Card Box",
              "subtitle": "Nestasia",
              "location": "Nestasia",
              "externalId": "bcb497b6-24ec-5b9f-9af2-e496167542a1",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/22/8a970eab0fcbc692b97865fef50d96b816b62d93.jpg",
              "price": "₹520",
              "judgment": "Wooden Playing Card Box",
              "reasoning": "Stylish storage",
              "attributes": {
                "ctaUrl": "https://nestasia.in/products/wooden-box-with-playing-cards",
                "visualQuery": "Wooden Playing Card Box"
              },
              "raw": "<card title=\"Wooden Playing Card Box\" place_id=\"bcb497b6-24ec-5b9f-9af2-e496167542a1\"><badge>Wooden Playing Card Box</badge><price>₹520</price><why>Stylish storage</why><visual query=\"Wooden Playing Card Box\" title=\"Wooden Playing Card Box\" place_id=\"bcb497b6-24ec-5b9f-9af2-e496167542a1\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/22/8a970eab0fcbc692b97865fef50d96b816b62d93.jpg\"/><cta>https://nestasia.in/products/wooden-box-with-playing-cards</cta></card>"
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "entity-37",
                  "type": "generic",
                  "title": "Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles",
                  "subtitle": "Nestasia",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/362e90d0640a70ac524da8a26a67be8e1a043345.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹1590",
                    "placeId": "b9914061-177e-5f3f-9404-cb08ce55edc6",
                    "judgment": "Wooden Ludo Solitaire 2-in-1 Game",
                    "signal": "Classic"
                  }
                },
                {
                  "id": "entity-38",
                  "type": "generic",
                  "title": "Playing Cards – Backwaters Deck",
                  "subtitle": "The Confetti Tree",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/1afe4c7873c779097ceae05d2b2c6279e55b7d59.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹1077",
                    "placeId": "9ab98e5a-e1b1-5807-a235-54d887e80b60",
                    "judgment": "Playing Cards – Backwaters Deck"
                  }
                },
                {
                  "id": "entity-39",
                  "type": "generic",
                  "title": "Playing Cards Set Of 2 in Wooden Display Box",
                  "subtitle": "Nestasia",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/f465a8ee2799588aa219f91dd503fe579d28befe.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹760",
                    "placeId": "17dbac1f-0a86-5ba9-8f5b-9f844bc5df7e",
                    "judgment": "Playing Cards Set Of 2 in Wooden Box"
                  }
                },
                {
                  "id": "entity-40",
                  "type": "generic",
                  "title": "Wooden Playing Card Box",
                  "subtitle": "Nestasia",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/22/8a970eab0fcbc692b97865fef50d96b816b62d93.jpg",
                  "state": "discovered",
                  "metadata": {
                    "priceLevel": "₹520",
                    "placeId": "bcb497b6-24ec-5b9f-9af2-e496167542a1",
                    "judgment": "Wooden Playing Card Box"
                  }
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-18",
          "hs-20",
          "hs-34",
          "hs-36",
          "hs-38",
          "hs-40"
        ],
        "confidence": "high",
        "enterDuration": 1150,
        "holdDuration": 2900,
        "exitDuration": 300,
        "traceTiming": {
          "start": 6813.5,
          "end": 16436.5
        }
      },
      {
        "id": "list-complete",
        "visibility": "status",
        "narration": "Here's the set — worth exploring.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Show me more card game sets",
        "Find wooden game boards",
        "Look for family game collections",
        "Explore other indoor activities"
      ],
      "kind": "list",
      "headline": "The catalogue is heavily fashion-focused and doesn't carry traditional board or card games like Monopoly or UNO. However I found a couple of game-related items that are actually in stock:",
      "items": [
        {
          "id": "entity-37",
          "type": "generic",
          "title": "Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles",
          "subtitle": "Nestasia",
          "location": "Nestasia",
          "externalId": "b9914061-177e-5f3f-9404-cb08ce55edc6",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/362e90d0640a70ac524da8a26a67be8e1a043345.jpg",
          "price": "₹1590",
          "judgment": "Wooden Ludo Solitaire 2-in-1 Game",
          "reasoning": "Classic tabletop fun",
          "attributes": {
            "ctaUrl": "https://nestasia.in/products/wooden-ludo-solitaire-2-in-1-game-with-glass-marbles",
            "visualQuery": "Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles"
          },
          "raw": "<card title=\"Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles\" place_id=\"b9914061-177e-5f3f-9404-cb08ce55edc6\"><badge>Wooden Ludo Solitaire 2-in-1 Game</badge><price>₹1590</price><why>Classic tabletop fun</why><visual query=\"Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles\" title=\"Wooden Ludo Solitaire 2-in-1 Game With Glass Marbles\" place_id=\"b9914061-177e-5f3f-9404-cb08ce55edc6\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/362e90d0640a70ac524da8a26a67be8e1a043345.jpg\"/><cta>https://nestasia.in/products/wooden-ludo-solitaire-2-in-1-game-with-glass-marbles</cta></card>"
        },
        {
          "id": "entity-38",
          "type": "generic",
          "title": "Playing Cards – Backwaters Deck",
          "subtitle": "The Confetti Tree",
          "location": "The Confetti Tree",
          "externalId": "9ab98e5a-e1b1-5807-a235-54d887e80b60",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/1afe4c7873c779097ceae05d2b2c6279e55b7d59.jpg",
          "price": "₹1077",
          "judgment": "Playing Cards – Backwaters Deck",
          "reasoning": "Premium coastal design",
          "attributes": {
            "ctaUrl": "https://ikiru.in/products/playing-cards-backwaters-deck",
            "visualQuery": "Playing Cards – Backwaters Deck"
          },
          "raw": "<card title=\"Playing Cards – Backwaters Deck\" place_id=\"9ab98e5a-e1b1-5807-a235-54d887e80b60\"><badge>Playing Cards – Backwaters Deck</badge><price>₹1077</price><why>Premium coastal design</why><visual query=\"Playing Cards – Backwaters Deck\" title=\"Playing Cards – Backwaters Deck\" place_id=\"9ab98e5a-e1b1-5807-a235-54d887e80b60\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/1afe4c7873c779097ceae05d2b2c6279e55b7d59.jpg\"/><cta>https://ikiru.in/products/playing-cards-backwaters-deck</cta></card>"
        },
        {
          "id": "entity-39",
          "type": "generic",
          "title": "Playing Cards Set Of 2 in Wooden Display Box",
          "subtitle": "Nestasia",
          "location": "Nestasia",
          "externalId": "17dbac1f-0a86-5ba9-8f5b-9f844bc5df7e",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/f465a8ee2799588aa219f91dd503fe579d28befe.jpg",
          "price": "₹760",
          "judgment": "Playing Cards Set Of 2 in Wooden Box",
          "reasoning": "Elegant display",
          "attributes": {
            "ctaUrl": "https://nestasia.in/products/playing-cards-set-of-2-in-wooden-display-box",
            "visualQuery": "Playing Cards Set Of 2 in Wooden Display Box"
          },
          "raw": "<card title=\"Playing Cards Set Of 2 in Wooden Display Box\" place_id=\"17dbac1f-0a86-5ba9-8f5b-9f844bc5df7e\"><badge>Playing Cards Set Of 2 in Wooden Box</badge><price>₹760</price><why>Elegant display</why><visual query=\"Playing Cards Set Of 2 in Wooden Display Box\" title=\"Playing Cards Set Of 2 in Wooden Display Box\" place_id=\"17dbac1f-0a86-5ba9-8f5b-9f844bc5df7e\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/21/f465a8ee2799588aa219f91dd503fe579d28befe.jpg\"/><cta>https://nestasia.in/products/playing-cards-set-of-2-in-wooden-display-box</cta></card>"
        },
        {
          "id": "entity-40",
          "type": "generic",
          "title": "Wooden Playing Card Box",
          "subtitle": "Nestasia",
          "location": "Nestasia",
          "externalId": "bcb497b6-24ec-5b9f-9af2-e496167542a1",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/22/8a970eab0fcbc692b97865fef50d96b816b62d93.jpg",
          "price": "₹520",
          "judgment": "Wooden Playing Card Box",
          "reasoning": "Stylish storage",
          "attributes": {
            "ctaUrl": "https://nestasia.in/products/wooden-box-with-playing-cards",
            "visualQuery": "Wooden Playing Card Box"
          },
          "raw": "<card title=\"Wooden Playing Card Box\" place_id=\"bcb497b6-24ec-5b9f-9af2-e496167542a1\"><badge>Wooden Playing Card Box</badge><price>₹520</price><why>Stylish storage</why><visual query=\"Wooden Playing Card Box\" title=\"Wooden Playing Card Box\" place_id=\"bcb497b6-24ec-5b9f-9af2-e496167542a1\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/catalog/images/2025/11/22/8a970eab0fcbc692b97865fef50d96b816b62d93.jpg\"/><cta>https://nestasia.in/products/wooden-box-with-playing-cards</cta></card>"
        }
      ]
    },
    "classification": {
      "prompt": "Indoor board games and card games. Show products directly. Do not ask questions.",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": true,
      "outputShape": "place_card",
      "archetype": "list",
      "confidence": "high",
      "signals": [
        "Multiple peers with no ranking signal.",
        "4 comparable entities, 0 supporting block(s).",
        "6 search/retrieval call(s)."
      ],
      "entityCount": 4
    },
    "requirements": {
      "requestedAttributes": [],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": []
    },
    "metadata": {
      "toolSequence": [
        "ProductSearch",
        "ProductSearch",
        "ProductSearch",
        "ProductSearch",
        "ProductSearch",
        "ProductSearch"
      ],
      "skills": [
        "default",
        "fashion",
        "home_decor"
      ],
      "latencyMs": 23555,
      "entityCount": 4,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-11",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-22",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-24",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-26",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-28",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-29",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-30",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-31",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-32",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-33",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-35",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-37",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-39",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-41",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-42",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-43",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-44",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-45",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-46",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-47",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-48",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 42,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 22026,
      "list": {
        "rawResultCount": 15,
        "resolvedListCount": 4,
        "visibleListCount": 4,
        "narrationCount": 4,
        "imagesAvailable": 4,
        "itemSource": "discovery",
        "themeCount": 0
      },
      "captureId": "q04",
      "captureLabel": "Board & Card Games"
    }
  },
  {
    "id": "harness-q05",
    "archetype": "candidate_ranking",
    "prompt": "Continue the card's promise of finding the best Matcha Cheese Cloud spots near me. Find the highest-rated cafes and bubble tea shops near me serving Matcha Cheese Cloud. Include ratings, locality, price range, and what makes each spot special for this drink. Return a shortlist that makes choosing the perfect spot easy.",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q05",
    "thinkingPasses": [
      {
        "id": "cr-1-acknowledge",
        "visibility": "canvas_value",
        "narration": "Got it — let's see what's out there.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1350,
        "exitDuration": 250,
        "valueType": "intent",
        "payload": {
          "chips": [
            "Matcha Cheese Cloud",
            "Cafe",
            "Near me",
            "Highly rated",
            "Ratings"
          ]
        }
      },
      {
        "id": "cr-2-sources",
        "visibility": "status",
        "narration": "Checking places nearby on the map",
        "confidence": "high",
        "enterDuration": 800,
        "holdDuration": 2200,
        "exitDuration": 300
      },
      {
        "id": "cr-3-found",
        "visibility": "canvas_value",
        "narration": "Turned up 6 promising cafes",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-47",
              "type": "generic",
              "title": "Neko and Matcha Cafe, S.G. Palya",
              "subtitle": "S.G. Palya, Bengaluru",
              "location": "158, 1st cross, Christ University, back gate road, S.G. Palya, Bengaluru, Karnataka 560029, India",
              "externalId": "ChIJm59fC68VrjsRVPeGpPCAWVc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg",
              "rating": 5,
              "reviewCount": 107,
              "price": "₹200–400 per person",
              "judgment": "Top Pick",
              "reasoning": "Perfect 5-star rating with the most affordable premium matcha drinks in the city.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=6294203725267793748"
              },
              "raw": "<card title=\"Neko and Matcha Cafe, S.G. Palya\"><badge>Top Pick</badge><rating>5.0★ · 107 reviews</rating><price>₹200–400 per person</price><why>Perfect 5-star rating with the most affordable premium matcha drinks in the city.</why><visual query=\"\" title=\"Neko and Matcha Cafe, S.G. Palya\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg\"/><cta>https://maps.google.com/?cid=6294203725267793748</cta></card>"
            },
            {
              "id": "entity-48",
              "type": "generic",
              "title": "Moo Cha Kura, Koramangala",
              "subtitle": "Koramangala, Bengaluru",
              "location": "857, 6th cross, Koramangala Club Rd, 6th Block, Koramangala, Bengaluru, Karnataka 560095, India",
              "externalId": "ChIJvRznegAVrjsRNmxLubX5Wn4",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg",
              "rating": 4.9,
              "reviewCount": 54,
              "price": "₹400–600 per person",
              "judgment": "Best Value",
              "reasoning": "Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=9104864155576003638"
              },
              "raw": "<card title=\"Moo Cha Kura, Koramangala\"><badge>Best Value</badge><rating>4.9★ · 54 reviews</rating><price>₹400–600 per person</price><why>Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.</why><visual query=\"\" title=\"Moo Cha Kura, Koramangala\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg\"/><cta>https://maps.google.com/?cid=9104864155576003638</cta></card>"
            },
            {
              "id": "entity-49",
              "type": "generic",
              "title": "Turtle Matcha, Indiranagar",
              "subtitle": "Indiranagar, Bengaluru",
              "location": "Ground Floor, 1329, 13th Cross Rd, 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
              "externalId": "ChIJq9uLxq8XrjsRaGBwlYlMfZc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg",
              "rating": 4.7,
              "reviewCount": 279,
              "price": "₹200–400 per person",
              "judgment": "Crowd Favourite",
              "reasoning": "High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10915965225617350760"
              },
              "raw": "<card title=\"Turtle Matcha, Indiranagar\"><badge>Crowd Favourite</badge><rating>4.7★ · 279 reviews</rating><price>₹200–400 per person</price><why>High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.</why><visual query=\"\" title=\"Turtle Matcha, Indiranagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg\"/><cta>https://maps.google.com/?cid=10915965225617350760</cta></card>"
            },
            {
              "id": "entity-50",
              "type": "generic",
              "title": "Matcha Mori, Richmond Town",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg",
              "rating": 4.8,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "judgment": "Premium Pick",
              "reasoning": "Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16824778487225471361",
                "phone": "077604 04003"
              },
              "raw": "<card title=\"Matcha Mori, Richmond Town\"><badge>Premium Pick</badge><rating>4.8★ · 49 reviews</rating><price>₹400–600 per person</price><why>Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.</why><visual query=\"\" title=\"Matcha Mori, Richmond Town\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg\"/><cta>https://maps.google.com/?cid=16824778487225471361</cta><phone>077604 04003</phone></card>"
            },
            {
              "id": "entity-51",
              "type": "generic",
              "title": "Latcha, JP Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg",
              "rating": 4.6,
              "reviewCount": 224,
              "price": "₹200–400 per person",
              "judgment": "Hidden Gem",
              "reasoning": "Great value spot with a loyal following and consistently fluffy cheese cloud layers.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14661890377321001120",
                "phone": "091005 65985"
              },
              "raw": "<card title=\"Latcha, JP Nagar\"><badge>Hidden Gem</badge><rating>4.6★ · 224 reviews</rating><price>₹200–400 per person</price><why>Great value spot with a loyal following and consistently fluffy cheese cloud layers.</why><visual query=\"\" title=\"Latcha, JP Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg\"/><cta>https://maps.google.com/?cid=14661890377321001120</cta><phone>091005 65985</phone></card>"
            },
            {
              "id": "entity-52",
              "type": "generic",
              "title": "Boba Bhai, Rajarajeshwari Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg",
              "rating": 4.6,
              "reviewCount": 274,
              "price": "₹200–400 per person",
              "judgment": "Bubble Tea Specialist",
              "reasoning": "Korean bubble tea house that nails the cheese cloud texture with boba options.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15647220361084676203",
                "phone": "079756 73970"
              },
              "raw": "<card title=\"Boba Bhai, Rajarajeshwari Nagar\"><badge>Bubble Tea Specialist</badge><rating>4.6★ · 274 reviews</rating><price>₹200–400 per person</price><why>Korean bubble tea house that nails the cheese cloud texture with boba options.</why><visual query=\"\" title=\"Boba Bhai, Rajarajeshwari Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg\"/><cta>https://maps.google.com/?cid=15647220361084676203</cta><phone>079756 73970</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "entity-47",
                  "type": "generic",
                  "title": "Neko and Matcha Cafe, S.G. Palya",
                  "subtitle": "S.G. Palya, Bengaluru",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-48",
                  "type": "generic",
                  "title": "Moo Cha Kura, Koramangala",
                  "subtitle": "Koramangala, Bengaluru",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-49",
                  "type": "generic",
                  "title": "Turtle Matcha, Indiranagar",
                  "subtitle": "Indiranagar, Bengaluru",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-50",
                  "type": "generic",
                  "title": "Matcha Mori, Richmond Town",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-51",
                  "type": "generic",
                  "title": "Latcha, JP Nagar",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-52",
                  "type": "generic",
                  "title": "Boba Bhai, Rajarajeshwari Nagar",
                  "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg",
                  "state": "discovered",
                  "metadata": {}
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-15"
        ],
        "confidence": "high",
        "debug": {
          "narrationCount": 6,
          "visibleCandidateCount": 6,
          "canonicalCandidateCount": 6,
          "discoveryExtracted": 6,
          "finalResponseExtracted": 6,
          "entitySource": "final_response_backfill",
          "subsetSource": "inferred_from_final_order",
          "imagesAvailable": 6,
          "coordinatesAvailable": 0
        },
        "enterDuration": 950,
        "holdDuration": 2500,
        "exitDuration": 300,
        "traceTiming": {
          "start": 5768,
          "end": 6686.5
        }
      },
      {
        "id": "cr-4-enrich",
        "visibility": "canvas_value",
        "narration": "Checking prices and ratings",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-47",
              "type": "generic",
              "title": "Neko and Matcha Cafe, S.G. Palya",
              "subtitle": "S.G. Palya, Bengaluru",
              "location": "158, 1st cross, Christ University, back gate road, S.G. Palya, Bengaluru, Karnataka 560029, India",
              "externalId": "ChIJm59fC68VrjsRVPeGpPCAWVc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg",
              "rating": 5,
              "reviewCount": 107,
              "price": "₹200–400 per person",
              "judgment": "Top Pick",
              "reasoning": "Perfect 5-star rating with the most affordable premium matcha drinks in the city.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=6294203725267793748"
              },
              "raw": "<card title=\"Neko and Matcha Cafe, S.G. Palya\"><badge>Top Pick</badge><rating>5.0★ · 107 reviews</rating><price>₹200–400 per person</price><why>Perfect 5-star rating with the most affordable premium matcha drinks in the city.</why><visual query=\"\" title=\"Neko and Matcha Cafe, S.G. Palya\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg\"/><cta>https://maps.google.com/?cid=6294203725267793748</cta></card>"
            },
            {
              "id": "entity-48",
              "type": "generic",
              "title": "Moo Cha Kura, Koramangala",
              "subtitle": "Koramangala, Bengaluru",
              "location": "857, 6th cross, Koramangala Club Rd, 6th Block, Koramangala, Bengaluru, Karnataka 560095, India",
              "externalId": "ChIJvRznegAVrjsRNmxLubX5Wn4",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg",
              "rating": 4.9,
              "reviewCount": 54,
              "price": "₹400–600 per person",
              "judgment": "Best Value",
              "reasoning": "Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=9104864155576003638"
              },
              "raw": "<card title=\"Moo Cha Kura, Koramangala\"><badge>Best Value</badge><rating>4.9★ · 54 reviews</rating><price>₹400–600 per person</price><why>Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.</why><visual query=\"\" title=\"Moo Cha Kura, Koramangala\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg\"/><cta>https://maps.google.com/?cid=9104864155576003638</cta></card>"
            },
            {
              "id": "entity-49",
              "type": "generic",
              "title": "Turtle Matcha, Indiranagar",
              "subtitle": "Indiranagar, Bengaluru",
              "location": "Ground Floor, 1329, 13th Cross Rd, 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
              "externalId": "ChIJq9uLxq8XrjsRaGBwlYlMfZc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg",
              "rating": 4.7,
              "reviewCount": 279,
              "price": "₹200–400 per person",
              "judgment": "Crowd Favourite",
              "reasoning": "High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10915965225617350760"
              },
              "raw": "<card title=\"Turtle Matcha, Indiranagar\"><badge>Crowd Favourite</badge><rating>4.7★ · 279 reviews</rating><price>₹200–400 per person</price><why>High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.</why><visual query=\"\" title=\"Turtle Matcha, Indiranagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg\"/><cta>https://maps.google.com/?cid=10915965225617350760</cta></card>"
            },
            {
              "id": "entity-50",
              "type": "generic",
              "title": "Matcha Mori, Richmond Town",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg",
              "rating": 4.8,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "judgment": "Premium Pick",
              "reasoning": "Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16824778487225471361",
                "phone": "077604 04003"
              },
              "raw": "<card title=\"Matcha Mori, Richmond Town\"><badge>Premium Pick</badge><rating>4.8★ · 49 reviews</rating><price>₹400–600 per person</price><why>Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.</why><visual query=\"\" title=\"Matcha Mori, Richmond Town\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg\"/><cta>https://maps.google.com/?cid=16824778487225471361</cta><phone>077604 04003</phone></card>"
            },
            {
              "id": "entity-51",
              "type": "generic",
              "title": "Latcha, JP Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg",
              "rating": 4.6,
              "reviewCount": 224,
              "price": "₹200–400 per person",
              "judgment": "Hidden Gem",
              "reasoning": "Great value spot with a loyal following and consistently fluffy cheese cloud layers.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14661890377321001120",
                "phone": "091005 65985"
              },
              "raw": "<card title=\"Latcha, JP Nagar\"><badge>Hidden Gem</badge><rating>4.6★ · 224 reviews</rating><price>₹200–400 per person</price><why>Great value spot with a loyal following and consistently fluffy cheese cloud layers.</why><visual query=\"\" title=\"Latcha, JP Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg\"/><cta>https://maps.google.com/?cid=14661890377321001120</cta><phone>091005 65985</phone></card>"
            },
            {
              "id": "entity-52",
              "type": "generic",
              "title": "Boba Bhai, Rajarajeshwari Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg",
              "rating": 4.6,
              "reviewCount": 274,
              "price": "₹200–400 per person",
              "judgment": "Bubble Tea Specialist",
              "reasoning": "Korean bubble tea house that nails the cheese cloud texture with boba options.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15647220361084676203",
                "phone": "079756 73970"
              },
              "raw": "<card title=\"Boba Bhai, Rajarajeshwari Nagar\"><badge>Bubble Tea Specialist</badge><rating>4.6★ · 274 reviews</rating><price>₹200–400 per person</price><why>Korean bubble tea house that nails the cheese cloud texture with boba options.</why><visual query=\"\" title=\"Boba Bhai, Rajarajeshwari Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg\"/><cta>https://maps.google.com/?cid=15647220361084676203</cta><phone>079756 73970</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ENRICH_ITEMS",
              "patches": [
                {
                  "id": "entity-47",
                  "data": {
                    "rating": 5,
                    "reviewCount": 107,
                    "priceLevel": "₹200–400 per person"
                  }
                },
                {
                  "id": "entity-48",
                  "data": {
                    "rating": 4.9,
                    "reviewCount": 54,
                    "priceLevel": "₹400–600 per person"
                  }
                },
                {
                  "id": "entity-49",
                  "data": {
                    "rating": 4.7,
                    "reviewCount": 279,
                    "priceLevel": "₹200–400 per person"
                  }
                },
                {
                  "id": "entity-50",
                  "data": {
                    "rating": 4.8,
                    "reviewCount": 49,
                    "priceLevel": "₹400–600 per person"
                  }
                },
                {
                  "id": "entity-51",
                  "data": {
                    "rating": 4.6,
                    "reviewCount": 224,
                    "priceLevel": "₹200–400 per person"
                  }
                },
                {
                  "id": "entity-52",
                  "data": {
                    "rating": 4.6,
                    "reviewCount": 274,
                    "priceLevel": "₹200–400 per person"
                  }
                }
              ]
            }
          ]
        },
        "sourceEventIds": [],
        "confidence": "high",
        "enterDuration": 750,
        "holdDuration": 2650,
        "exitDuration": 300
      },
      {
        "id": "cr-5-compare-price",
        "visibility": "canvas_value",
        "narration": "Looking at what each one costs",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-47",
              "type": "generic",
              "title": "Neko and Matcha Cafe, S.G. Palya",
              "subtitle": "S.G. Palya, Bengaluru",
              "location": "158, 1st cross, Christ University, back gate road, S.G. Palya, Bengaluru, Karnataka 560029, India",
              "externalId": "ChIJm59fC68VrjsRVPeGpPCAWVc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg",
              "rating": 5,
              "reviewCount": 107,
              "price": "₹200–400 per person",
              "judgment": "Top Pick",
              "reasoning": "Perfect 5-star rating with the most affordable premium matcha drinks in the city.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=6294203725267793748"
              },
              "raw": "<card title=\"Neko and Matcha Cafe, S.G. Palya\"><badge>Top Pick</badge><rating>5.0★ · 107 reviews</rating><price>₹200–400 per person</price><why>Perfect 5-star rating with the most affordable premium matcha drinks in the city.</why><visual query=\"\" title=\"Neko and Matcha Cafe, S.G. Palya\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg\"/><cta>https://maps.google.com/?cid=6294203725267793748</cta></card>"
            },
            {
              "id": "entity-48",
              "type": "generic",
              "title": "Moo Cha Kura, Koramangala",
              "subtitle": "Koramangala, Bengaluru",
              "location": "857, 6th cross, Koramangala Club Rd, 6th Block, Koramangala, Bengaluru, Karnataka 560095, India",
              "externalId": "ChIJvRznegAVrjsRNmxLubX5Wn4",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg",
              "rating": 4.9,
              "reviewCount": 54,
              "price": "₹400–600 per person",
              "judgment": "Best Value",
              "reasoning": "Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=9104864155576003638"
              },
              "raw": "<card title=\"Moo Cha Kura, Koramangala\"><badge>Best Value</badge><rating>4.9★ · 54 reviews</rating><price>₹400–600 per person</price><why>Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.</why><visual query=\"\" title=\"Moo Cha Kura, Koramangala\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg\"/><cta>https://maps.google.com/?cid=9104864155576003638</cta></card>"
            },
            {
              "id": "entity-49",
              "type": "generic",
              "title": "Turtle Matcha, Indiranagar",
              "subtitle": "Indiranagar, Bengaluru",
              "location": "Ground Floor, 1329, 13th Cross Rd, 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
              "externalId": "ChIJq9uLxq8XrjsRaGBwlYlMfZc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg",
              "rating": 4.7,
              "reviewCount": 279,
              "price": "₹200–400 per person",
              "judgment": "Crowd Favourite",
              "reasoning": "High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10915965225617350760"
              },
              "raw": "<card title=\"Turtle Matcha, Indiranagar\"><badge>Crowd Favourite</badge><rating>4.7★ · 279 reviews</rating><price>₹200–400 per person</price><why>High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.</why><visual query=\"\" title=\"Turtle Matcha, Indiranagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg\"/><cta>https://maps.google.com/?cid=10915965225617350760</cta></card>"
            },
            {
              "id": "entity-50",
              "type": "generic",
              "title": "Matcha Mori, Richmond Town",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg",
              "rating": 4.8,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "judgment": "Premium Pick",
              "reasoning": "Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16824778487225471361",
                "phone": "077604 04003"
              },
              "raw": "<card title=\"Matcha Mori, Richmond Town\"><badge>Premium Pick</badge><rating>4.8★ · 49 reviews</rating><price>₹400–600 per person</price><why>Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.</why><visual query=\"\" title=\"Matcha Mori, Richmond Town\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg\"/><cta>https://maps.google.com/?cid=16824778487225471361</cta><phone>077604 04003</phone></card>"
            },
            {
              "id": "entity-51",
              "type": "generic",
              "title": "Latcha, JP Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg",
              "rating": 4.6,
              "reviewCount": 224,
              "price": "₹200–400 per person",
              "judgment": "Hidden Gem",
              "reasoning": "Great value spot with a loyal following and consistently fluffy cheese cloud layers.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14661890377321001120",
                "phone": "091005 65985"
              },
              "raw": "<card title=\"Latcha, JP Nagar\"><badge>Hidden Gem</badge><rating>4.6★ · 224 reviews</rating><price>₹200–400 per person</price><why>Great value spot with a loyal following and consistently fluffy cheese cloud layers.</why><visual query=\"\" title=\"Latcha, JP Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg\"/><cta>https://maps.google.com/?cid=14661890377321001120</cta><phone>091005 65985</phone></card>"
            },
            {
              "id": "entity-52",
              "type": "generic",
              "title": "Boba Bhai, Rajarajeshwari Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg",
              "rating": 4.6,
              "reviewCount": 274,
              "price": "₹200–400 per person",
              "judgment": "Bubble Tea Specialist",
              "reasoning": "Korean bubble tea house that nails the cheese cloud texture with boba options.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15647220361084676203",
                "phone": "079756 73970"
              },
              "raw": "<card title=\"Boba Bhai, Rajarajeshwari Nagar\"><badge>Bubble Tea Specialist</badge><rating>4.6★ · 274 reviews</rating><price>₹200–400 per person</price><why>Korean bubble tea house that nails the cheese cloud texture with boba options.</why><visual query=\"\" title=\"Boba Bhai, Rajarajeshwari Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg\"/><cta>https://maps.google.com/?cid=15647220361084676203</cta><phone>079756 73970</phone></card>"
            }
          ],
          "comparison": {
            "key": "price",
            "label": "Price",
            "scale": "numeric",
            "values": {
              "entity-47": {
                "display": "₹200",
                "note": "–400 per person"
              },
              "entity-48": {
                "display": "₹400",
                "note": "–600 per person"
              },
              "entity-49": {
                "display": "₹200",
                "note": "–400 per person"
              },
              "entity-50": {
                "display": "₹400",
                "note": "–600 per person"
              },
              "entity-51": {
                "display": "₹200",
                "note": "–400 per person"
              },
              "entity-52": {
                "display": "₹200",
                "note": "–400 per person"
              }
            },
            "step": 0,
            "stepCount": 2
          }
        },
        "confidence": "high",
        "enterDuration": 900,
        "holdDuration": 1550,
        "exitDuration": 250
      },
      {
        "id": "cr-5-compare-rating",
        "visibility": "canvas_value",
        "narration": "Looking at ratings",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-47",
              "type": "generic",
              "title": "Neko and Matcha Cafe, S.G. Palya",
              "subtitle": "S.G. Palya, Bengaluru",
              "location": "158, 1st cross, Christ University, back gate road, S.G. Palya, Bengaluru, Karnataka 560029, India",
              "externalId": "ChIJm59fC68VrjsRVPeGpPCAWVc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg",
              "rating": 5,
              "reviewCount": 107,
              "price": "₹200–400 per person",
              "judgment": "Top Pick",
              "reasoning": "Perfect 5-star rating with the most affordable premium matcha drinks in the city.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=6294203725267793748"
              },
              "raw": "<card title=\"Neko and Matcha Cafe, S.G. Palya\"><badge>Top Pick</badge><rating>5.0★ · 107 reviews</rating><price>₹200–400 per person</price><why>Perfect 5-star rating with the most affordable premium matcha drinks in the city.</why><visual query=\"\" title=\"Neko and Matcha Cafe, S.G. Palya\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg\"/><cta>https://maps.google.com/?cid=6294203725267793748</cta></card>"
            },
            {
              "id": "entity-48",
              "type": "generic",
              "title": "Moo Cha Kura, Koramangala",
              "subtitle": "Koramangala, Bengaluru",
              "location": "857, 6th cross, Koramangala Club Rd, 6th Block, Koramangala, Bengaluru, Karnataka 560095, India",
              "externalId": "ChIJvRznegAVrjsRNmxLubX5Wn4",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg",
              "rating": 4.9,
              "reviewCount": 54,
              "price": "₹400–600 per person",
              "judgment": "Best Value",
              "reasoning": "Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=9104864155576003638"
              },
              "raw": "<card title=\"Moo Cha Kura, Koramangala\"><badge>Best Value</badge><rating>4.9★ · 54 reviews</rating><price>₹400–600 per person</price><why>Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.</why><visual query=\"\" title=\"Moo Cha Kura, Koramangala\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg\"/><cta>https://maps.google.com/?cid=9104864155576003638</cta></card>"
            },
            {
              "id": "entity-49",
              "type": "generic",
              "title": "Turtle Matcha, Indiranagar",
              "subtitle": "Indiranagar, Bengaluru",
              "location": "Ground Floor, 1329, 13th Cross Rd, 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
              "externalId": "ChIJq9uLxq8XrjsRaGBwlYlMfZc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg",
              "rating": 4.7,
              "reviewCount": 279,
              "price": "₹200–400 per person",
              "judgment": "Crowd Favourite",
              "reasoning": "High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10915965225617350760"
              },
              "raw": "<card title=\"Turtle Matcha, Indiranagar\"><badge>Crowd Favourite</badge><rating>4.7★ · 279 reviews</rating><price>₹200–400 per person</price><why>High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.</why><visual query=\"\" title=\"Turtle Matcha, Indiranagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg\"/><cta>https://maps.google.com/?cid=10915965225617350760</cta></card>"
            },
            {
              "id": "entity-50",
              "type": "generic",
              "title": "Matcha Mori, Richmond Town",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg",
              "rating": 4.8,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "judgment": "Premium Pick",
              "reasoning": "Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16824778487225471361",
                "phone": "077604 04003"
              },
              "raw": "<card title=\"Matcha Mori, Richmond Town\"><badge>Premium Pick</badge><rating>4.8★ · 49 reviews</rating><price>₹400–600 per person</price><why>Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.</why><visual query=\"\" title=\"Matcha Mori, Richmond Town\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg\"/><cta>https://maps.google.com/?cid=16824778487225471361</cta><phone>077604 04003</phone></card>"
            },
            {
              "id": "entity-51",
              "type": "generic",
              "title": "Latcha, JP Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg",
              "rating": 4.6,
              "reviewCount": 224,
              "price": "₹200–400 per person",
              "judgment": "Hidden Gem",
              "reasoning": "Great value spot with a loyal following and consistently fluffy cheese cloud layers.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14661890377321001120",
                "phone": "091005 65985"
              },
              "raw": "<card title=\"Latcha, JP Nagar\"><badge>Hidden Gem</badge><rating>4.6★ · 224 reviews</rating><price>₹200–400 per person</price><why>Great value spot with a loyal following and consistently fluffy cheese cloud layers.</why><visual query=\"\" title=\"Latcha, JP Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg\"/><cta>https://maps.google.com/?cid=14661890377321001120</cta><phone>091005 65985</phone></card>"
            },
            {
              "id": "entity-52",
              "type": "generic",
              "title": "Boba Bhai, Rajarajeshwari Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg",
              "rating": 4.6,
              "reviewCount": 274,
              "price": "₹200–400 per person",
              "judgment": "Bubble Tea Specialist",
              "reasoning": "Korean bubble tea house that nails the cheese cloud texture with boba options.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15647220361084676203",
                "phone": "079756 73970"
              },
              "raw": "<card title=\"Boba Bhai, Rajarajeshwari Nagar\"><badge>Bubble Tea Specialist</badge><rating>4.6★ · 274 reviews</rating><price>₹200–400 per person</price><why>Korean bubble tea house that nails the cheese cloud texture with boba options.</why><visual query=\"\" title=\"Boba Bhai, Rajarajeshwari Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg\"/><cta>https://maps.google.com/?cid=15647220361084676203</cta><phone>079756 73970</phone></card>"
            }
          ],
          "comparison": {
            "key": "rating",
            "label": "Rating",
            "scale": "numeric",
            "values": {
              "entity-47": {
                "display": "5★"
              },
              "entity-48": {
                "display": "4.9★"
              },
              "entity-49": {
                "display": "4.7★"
              },
              "entity-50": {
                "display": "4.8★"
              },
              "entity-51": {
                "display": "4.6★"
              },
              "entity-52": {
                "display": "4.6★"
              }
            },
            "leaderIds": [
              "entity-47"
            ],
            "leaderLabel": "Top rated",
            "step": 1,
            "stepCount": 2
          }
        },
        "confidence": "high",
        "enterDuration": 900,
        "holdDuration": 1550,
        "exitDuration": 250
      },
      {
        "id": "cr-6-narrow",
        "visibility": "canvas_value",
        "narration": "3 stand out",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-47",
              "type": "generic",
              "title": "Neko and Matcha Cafe, S.G. Palya",
              "subtitle": "S.G. Palya, Bengaluru",
              "location": "158, 1st cross, Christ University, back gate road, S.G. Palya, Bengaluru, Karnataka 560029, India",
              "externalId": "ChIJm59fC68VrjsRVPeGpPCAWVc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg",
              "rating": 5,
              "reviewCount": 107,
              "price": "₹200–400 per person",
              "judgment": "Top Pick",
              "reasoning": "Perfect 5-star rating with the most affordable premium matcha drinks in the city.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=6294203725267793748"
              },
              "raw": "<card title=\"Neko and Matcha Cafe, S.G. Palya\"><badge>Top Pick</badge><rating>5.0★ · 107 reviews</rating><price>₹200–400 per person</price><why>Perfect 5-star rating with the most affordable premium matcha drinks in the city.</why><visual query=\"\" title=\"Neko and Matcha Cafe, S.G. Palya\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg\"/><cta>https://maps.google.com/?cid=6294203725267793748</cta></card>"
            },
            {
              "id": "entity-48",
              "type": "generic",
              "title": "Moo Cha Kura, Koramangala",
              "subtitle": "Koramangala, Bengaluru",
              "location": "857, 6th cross, Koramangala Club Rd, 6th Block, Koramangala, Bengaluru, Karnataka 560095, India",
              "externalId": "ChIJvRznegAVrjsRNmxLubX5Wn4",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg",
              "rating": 4.9,
              "reviewCount": 54,
              "price": "₹400–600 per person",
              "judgment": "Best Value",
              "reasoning": "Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=9104864155576003638"
              },
              "raw": "<card title=\"Moo Cha Kura, Koramangala\"><badge>Best Value</badge><rating>4.9★ · 54 reviews</rating><price>₹400–600 per person</price><why>Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.</why><visual query=\"\" title=\"Moo Cha Kura, Koramangala\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg\"/><cta>https://maps.google.com/?cid=9104864155576003638</cta></card>"
            },
            {
              "id": "entity-49",
              "type": "generic",
              "title": "Turtle Matcha, Indiranagar",
              "subtitle": "Indiranagar, Bengaluru",
              "location": "Ground Floor, 1329, 13th Cross Rd, 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
              "externalId": "ChIJq9uLxq8XrjsRaGBwlYlMfZc",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg",
              "rating": 4.7,
              "reviewCount": 279,
              "price": "₹200–400 per person",
              "judgment": "Crowd Favourite",
              "reasoning": "High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10915965225617350760"
              },
              "raw": "<card title=\"Turtle Matcha, Indiranagar\"><badge>Crowd Favourite</badge><rating>4.7★ · 279 reviews</rating><price>₹200–400 per person</price><why>High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.</why><visual query=\"\" title=\"Turtle Matcha, Indiranagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg\"/><cta>https://maps.google.com/?cid=10915965225617350760</cta></card>"
            },
            {
              "id": "entity-50",
              "type": "generic",
              "title": "Matcha Mori, Richmond Town",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg",
              "rating": 4.8,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "judgment": "Premium Pick",
              "reasoning": "Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16824778487225471361",
                "phone": "077604 04003"
              },
              "raw": "<card title=\"Matcha Mori, Richmond Town\"><badge>Premium Pick</badge><rating>4.8★ · 49 reviews</rating><price>₹400–600 per person</price><why>Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.</why><visual query=\"\" title=\"Matcha Mori, Richmond Town\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg\"/><cta>https://maps.google.com/?cid=16824778487225471361</cta><phone>077604 04003</phone></card>"
            },
            {
              "id": "entity-51",
              "type": "generic",
              "title": "Latcha, JP Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg",
              "rating": 4.6,
              "reviewCount": 224,
              "price": "₹200–400 per person",
              "judgment": "Hidden Gem",
              "reasoning": "Great value spot with a loyal following and consistently fluffy cheese cloud layers.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14661890377321001120",
                "phone": "091005 65985"
              },
              "raw": "<card title=\"Latcha, JP Nagar\"><badge>Hidden Gem</badge><rating>4.6★ · 224 reviews</rating><price>₹200–400 per person</price><why>Great value spot with a loyal following and consistently fluffy cheese cloud layers.</why><visual query=\"\" title=\"Latcha, JP Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg\"/><cta>https://maps.google.com/?cid=14661890377321001120</cta><phone>091005 65985</phone></card>"
            },
            {
              "id": "entity-52",
              "type": "generic",
              "title": "Boba Bhai, Rajarajeshwari Nagar",
              "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg",
              "rating": 4.6,
              "reviewCount": 274,
              "price": "₹200–400 per person",
              "judgment": "Bubble Tea Specialist",
              "reasoning": "Korean bubble tea house that nails the cheese cloud texture with boba options.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15647220361084676203",
                "phone": "079756 73970"
              },
              "raw": "<card title=\"Boba Bhai, Rajarajeshwari Nagar\"><badge>Bubble Tea Specialist</badge><rating>4.6★ · 274 reviews</rating><price>₹200–400 per person</price><why>Korean bubble tea house that nails the cheese cloud texture with boba options.</why><visual query=\"\" title=\"Boba Bhai, Rajarajeshwari Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg\"/><cta>https://maps.google.com/?cid=15647220361084676203</cta><phone>079756 73970</phone></card>"
            }
          ],
          "emphasisIds": [
            "entity-47",
            "entity-48",
            "entity-50"
          ],
          "canvas": [
            {
              "type": "SHORTLIST_ITEMS",
              "ids": [
                "entity-47",
                "entity-48",
                "entity-50"
              ]
            }
          ]
        },
        "confidence": "medium",
        "enterDuration": 850,
        "holdDuration": 2550,
        "exitDuration": 300
      },
      {
        "id": "cr-7-complete",
        "visibility": "status",
        "narration": "I've got the strongest options.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Get directions to Neko and Matcha Cafe",
        "Check opening hours for Turtle Matcha",
        "Find more bubble tea shops in Indiranagar",
        "See reviews for Matcha Mori Richmond Town"
      ],
      "kind": "entity_rail",
      "headline": "For the absolute best experience, start with Neko and Matcha Cafe — it's the only spot with a perfect 5-star rating and the most affordable premium matcha drink",
      "entities": [
        {
          "id": "entity-47",
          "type": "generic",
          "title": "Neko and Matcha Cafe, S.G. Palya",
          "subtitle": "S.G. Palya, Bengaluru",
          "location": "158, 1st cross, Christ University, back gate road, S.G. Palya, Bengaluru, Karnataka 560029, India",
          "externalId": "ChIJm59fC68VrjsRVPeGpPCAWVc",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg",
          "rating": 5,
          "reviewCount": 107,
          "price": "₹200–400 per person",
          "judgment": "Top Pick",
          "reasoning": "Perfect 5-star rating with the most affordable premium matcha drinks in the city.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=6294203725267793748"
          },
          "raw": "<card title=\"Neko and Matcha Cafe, S.G. Palya\"><badge>Top Pick</badge><rating>5.0★ · 107 reviews</rating><price>₹200–400 per person</price><why>Perfect 5-star rating with the most affordable premium matcha drinks in the city.</why><visual query=\"\" title=\"Neko and Matcha Cafe, S.G. Palya\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/nekomatcha.jpg\"/><cta>https://maps.google.com/?cid=6294203725267793748</cta></card>"
        },
        {
          "id": "entity-48",
          "type": "generic",
          "title": "Moo Cha Kura, Koramangala",
          "subtitle": "Koramangala, Bengaluru",
          "location": "857, 6th cross, Koramangala Club Rd, 6th Block, Koramangala, Bengaluru, Karnataka 560095, India",
          "externalId": "ChIJvRznegAVrjsRNmxLubX5Wn4",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg",
          "rating": 4.9,
          "reviewCount": 54,
          "price": "₹400–600 per person",
          "judgment": "Best Value",
          "reasoning": "Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=9104864155576003638"
          },
          "raw": "<card title=\"Moo Cha Kura, Koramangala\"><badge>Best Value</badge><rating>4.9★ · 54 reviews</rating><price>₹400–600 per person</price><why>Specialized matcha bar with consistent quality and a dedicated cheese cloud menu.</why><visual query=\"\" title=\"Moo Cha Kura, Koramangala\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/mookachakura.jpg\"/><cta>https://maps.google.com/?cid=9104864155576003638</cta></card>"
        },
        {
          "id": "entity-49",
          "type": "generic",
          "title": "Turtle Matcha, Indiranagar",
          "subtitle": "Indiranagar, Bengaluru",
          "location": "Ground Floor, 1329, 13th Cross Rd, 2nd Stage, Indiranagar, Bengaluru, Karnataka 560038, India",
          "externalId": "ChIJq9uLxq8XrjsRaGBwlYlMfZc",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg",
          "rating": 4.7,
          "reviewCount": 279,
          "price": "₹200–400 per person",
          "judgment": "Crowd Favourite",
          "reasoning": "High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=10915965225617350760"
          },
          "raw": "<card title=\"Turtle Matcha, Indiranagar\"><badge>Crowd Favourite</badge><rating>4.7★ · 279 reviews</rating><price>₹200–400 per person</price><why>High review volume with a trendy Indiranagar vibe and reliable cheese cloud preparation.</why><visual query=\"\" title=\"Turtle Matcha, Indiranagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/turtlematcha.jpg\"/><cta>https://maps.google.com/?cid=10915965225617350760</cta></card>"
        },
        {
          "id": "entity-50",
          "type": "generic",
          "title": "Matcha Mori, Richmond Town",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg",
          "rating": 4.8,
          "reviewCount": 49,
          "price": "₹400–600 per person",
          "judgment": "Premium Pick",
          "reasoning": "Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=16824778487225471361",
            "phone": "077604 04003"
          },
          "raw": "<card title=\"Matcha Mori, Richmond Town\"><badge>Premium Pick</badge><rating>4.8★ · 49 reviews</rating><price>₹400–600 per person</price><why>Upscale matcha bar known for premium grade matcha and artisanal cheese cloud toppings.</why><visual query=\"\" title=\"Matcha Mori, Richmond Town\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/matchamori.jpg\"/><cta>https://maps.google.com/?cid=16824778487225471361</cta><phone>077604 04003</phone></card>"
        },
        {
          "id": "entity-51",
          "type": "generic",
          "title": "Latcha, JP Nagar",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg",
          "rating": 4.6,
          "reviewCount": 224,
          "price": "₹200–400 per person",
          "judgment": "Hidden Gem",
          "reasoning": "Great value spot with a loyal following and consistently fluffy cheese cloud layers.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=14661890377321001120",
            "phone": "091005 65985"
          },
          "raw": "<card title=\"Latcha, JP Nagar\"><badge>Hidden Gem</badge><rating>4.6★ · 224 reviews</rating><price>₹200–400 per person</price><why>Great value spot with a loyal following and consistently fluffy cheese cloud layers.</why><visual query=\"\" title=\"Latcha, JP Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/latcha.jpg\"/><cta>https://maps.google.com/?cid=14661890377321001120</cta><phone>091005 65985</phone></card>"
        },
        {
          "id": "entity-52",
          "type": "generic",
          "title": "Boba Bhai, Rajarajeshwari Nagar",
          "image": "https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg",
          "rating": 4.6,
          "reviewCount": 274,
          "price": "₹200–400 per person",
          "judgment": "Bubble Tea Specialist",
          "reasoning": "Korean bubble tea house that nails the cheese cloud texture with boba options.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=15647220361084676203",
            "phone": "079756 73970"
          },
          "raw": "<card title=\"Boba Bhai, Rajarajeshwari Nagar\"><badge>Bubble Tea Specialist</badge><rating>4.6★ · 274 reviews</rating><price>₹200–400 per person</price><why>Korean bubble tea house that nails the cheese cloud texture with boba options.</why><visual query=\"\" title=\"Boba Bhai, Rajarajeshwari Nagar\" url=\"https://m-us-mob-ailooks-prod.glance-cdn.com/photo/bobabhai.jpg\"/><cta>https://maps.google.com/?cid=15647220361084676203</cta><phone>079756 73970</phone></card>"
        }
      ],
      "winnerId": "entity-47",
      "winnerRationale": "Perfect 5-star rating with the most affordable premium matcha drinks in the city.",
      "actions": {
        "entity-47": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=6294203725267793748",
            "intent": "directions"
          }
        ],
        "entity-48": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=9104864155576003638",
            "intent": "directions"
          }
        ],
        "entity-49": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=10915965225617350760",
            "intent": "directions"
          }
        ],
        "entity-50": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=16824778487225471361",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-51": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=14661890377321001120",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-52": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=15647220361084676203",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ]
      }
    },
    "classification": {
      "prompt": "Continue the card's promise of finding the best Matcha Cheese Cloud spots near me. Find the highest-rated cafes and bubble tea shops near me serving Matcha Cheese Cloud. Include ratings, locality, price range, and what makes each spot special for this drink. Return a shortlist that makes choosing the perfect spot easy.",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": true,
      "outputShape": "place_card",
      "archetype": "candidate_ranking",
      "confidence": "high",
      "signals": [
        "Explicit winner signal on \"Neko and Matcha Cafe, S.G. Palya\" (badge: Top Pick).",
        "6 comparable entities, 0 supporting block(s).",
        "1 search/retrieval call(s)."
      ],
      "entityCount": 6
    },
    "requirements": {
      "entityType": "cafe",
      "requestedAttributes": [
        "rating",
        "price",
        "location",
        "rationale"
      ],
      "comparisonIntent": false,
      "rankingIntent": true,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": [
        "ratings",
        "price",
        "locality",
        "near me",
        "what makes",
        "special",
        "best",
        "shortlist",
        "find"
      ]
    },
    "metadata": {
      "toolSequence": [
        "PlaceSearch"
      ],
      "skills": [
        "default",
        "food",
        "local_experiences"
      ],
      "latencyMs": 21372,
      "entityCount": 6,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-11",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-20",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-22",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 22,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 19733,
      "captureId": "q05",
      "captureLabel": "Matcha Cheese Cloud Cafés"
    }
  },
  {
    "id": "harness-q06",
    "archetype": "candidate_ranking",
    "prompt": "Find arancini restaurants near me that are open late.",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q06",
    "thinkingPasses": [
      {
        "id": "cr-1-acknowledge",
        "visibility": "canvas_value",
        "narration": "On it — finding the strongest options.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1350,
        "exitDuration": 250,
        "valueType": "intent",
        "payload": {
          "chips": [
            "Restaurant",
            "Near me",
            "Multiple options",
            "Location"
          ]
        }
      },
      {
        "id": "cr-2-sources",
        "visibility": "status",
        "narration": "Scanning what's nearby on the map",
        "confidence": "high",
        "enterDuration": 800,
        "holdDuration": 2200,
        "exitDuration": 300
      },
      {
        "id": "cr-3-found",
        "visibility": "canvas_value",
        "narration": "Turned up 4 promising restaurants",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-57",
              "type": "generic",
              "title": "Si Nonna's, Koramangala",
              "externalId": "ChIJuf5upEkVrjsRRyieAsaJl5U",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg",
              "rating": 4.8,
              "reviewCount": 1400,
              "price": "₹400–1600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Top Pick",
              "reasoning": "Known for crispy sourdough pizza and arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10779235716675020871",
                "phone": "079777 78047"
              },
              "raw": "<card title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\"><badge>Top Pick</badge><rating>4.8★ · 1.4k reviews</rating><price>₹400–1600 per person</price><why>Known for crispy sourdough pizza and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg\"/><cta>https://maps.google.com/?cid=10779235716675020871</cta><phone>079777 78047</phone></card>"
            },
            {
              "id": "entity-58",
              "type": "generic",
              "title": "Gnovi, Jayanagar",
              "externalId": "ChIJwZWoZQAVrjsRWiHAdeNWutI",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg",
              "rating": 4.6,
              "reviewCount": 386,
              "price": "₹600–1400 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Hidden Gem",
              "reasoning": "Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15184544628566139226",
                "phone": "083480 50003"
              },
              "raw": "<card title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\"><badge>Hidden Gem</badge><rating>4.6★ · 386 reviews</rating><price>₹600–1400 per person</price><why>Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg\"/><cta>https://maps.google.com/?cid=15184544628566139226</cta><phone>083480 50003</phone></card>"
            },
            {
              "id": "entity-59",
              "type": "generic",
              "title": "Chianti, Koramangala",
              "externalId": "ChIJwTjQW0EUrjsRIRf9d3YjyK4",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg",
              "rating": 4.5,
              "reviewCount": 6500,
              "availability": "Open till 10:30 PM",
              "judgment": "Crowd Favourite",
              "reasoning": "Classic Italian with warm ambiance and arancini; open till 10:30 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=12594355349667780385",
                "phone": "080 4113 2021"
              },
              "raw": "<card title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\"><badge>Crowd Favourite</badge><rating>4.5★ · 6.5k reviews</rating><why>Classic Italian with warm ambiance and arancini; open till 10:30 PM.</why><hours>Open till 10:30 PM</hours><visual query=\"\" title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg\"/><cta>https://maps.google.com/?cid=12594355349667780385</cta><phone>080 4113 2021</phone></card>"
            },
            {
              "id": "entity-60",
              "type": "generic",
              "title": "Pasta Street, Koramangala",
              "externalId": "ChIJEfXy3cIVrjsRFKH0ilntLN4",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg",
              "rating": 4.4,
              "reviewCount": 4600,
              "price": "₹600–1600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Best Value",
              "reasoning": "Reliable Italian with fresh pasta and arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16009431744234430740",
                "phone": "072592 32851"
              },
              "raw": "<card title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\"><badge>Best Value</badge><rating>4.4★ · 4.6k reviews</rating><price>₹600–1600 per person</price><why>Reliable Italian with fresh pasta and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg\"/><cta>https://maps.google.com/?cid=16009431744234430740</cta><phone>072592 32851</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "entity-57",
                  "type": "generic",
                  "title": "Si Nonna's, Koramangala",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-58",
                  "type": "generic",
                  "title": "Gnovi, Jayanagar",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-59",
                  "type": "generic",
                  "title": "Chianti, Koramangala",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-60",
                  "type": "generic",
                  "title": "Pasta Street, Koramangala",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg",
                  "state": "discovered",
                  "metadata": {}
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-11"
        ],
        "confidence": "high",
        "debug": {
          "narrationCount": 4,
          "visibleCandidateCount": 4,
          "canonicalCandidateCount": 4,
          "discoveryExtracted": 8,
          "finalResponseExtracted": 4,
          "entitySource": "final_response_backfill",
          "subsetSource": "inferred_from_final_order",
          "imagesAvailable": 4,
          "coordinatesAvailable": 0
        },
        "enterDuration": 950,
        "holdDuration": 2500,
        "exitDuration": 300,
        "traceTiming": {
          "start": 7771.5,
          "end": 8181
        }
      },
      {
        "id": "cr-5-compare",
        "visibility": "canvas_value",
        "narration": "Seeing how they stack up",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-57",
              "type": "generic",
              "title": "Si Nonna's, Koramangala",
              "externalId": "ChIJuf5upEkVrjsRRyieAsaJl5U",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg",
              "rating": 4.8,
              "reviewCount": 1400,
              "price": "₹400–1600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Top Pick",
              "reasoning": "Known for crispy sourdough pizza and arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10779235716675020871",
                "phone": "079777 78047"
              },
              "raw": "<card title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\"><badge>Top Pick</badge><rating>4.8★ · 1.4k reviews</rating><price>₹400–1600 per person</price><why>Known for crispy sourdough pizza and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg\"/><cta>https://maps.google.com/?cid=10779235716675020871</cta><phone>079777 78047</phone></card>"
            },
            {
              "id": "entity-58",
              "type": "generic",
              "title": "Gnovi, Jayanagar",
              "externalId": "ChIJwZWoZQAVrjsRWiHAdeNWutI",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg",
              "rating": 4.6,
              "reviewCount": 386,
              "price": "₹600–1400 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Hidden Gem",
              "reasoning": "Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15184544628566139226",
                "phone": "083480 50003"
              },
              "raw": "<card title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\"><badge>Hidden Gem</badge><rating>4.6★ · 386 reviews</rating><price>₹600–1400 per person</price><why>Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg\"/><cta>https://maps.google.com/?cid=15184544628566139226</cta><phone>083480 50003</phone></card>"
            },
            {
              "id": "entity-59",
              "type": "generic",
              "title": "Chianti, Koramangala",
              "externalId": "ChIJwTjQW0EUrjsRIRf9d3YjyK4",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg",
              "rating": 4.5,
              "reviewCount": 6500,
              "availability": "Open till 10:30 PM",
              "judgment": "Crowd Favourite",
              "reasoning": "Classic Italian with warm ambiance and arancini; open till 10:30 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=12594355349667780385",
                "phone": "080 4113 2021"
              },
              "raw": "<card title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\"><badge>Crowd Favourite</badge><rating>4.5★ · 6.5k reviews</rating><why>Classic Italian with warm ambiance and arancini; open till 10:30 PM.</why><hours>Open till 10:30 PM</hours><visual query=\"\" title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg\"/><cta>https://maps.google.com/?cid=12594355349667780385</cta><phone>080 4113 2021</phone></card>"
            },
            {
              "id": "entity-60",
              "type": "generic",
              "title": "Pasta Street, Koramangala",
              "externalId": "ChIJEfXy3cIVrjsRFKH0ilntLN4",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg",
              "rating": 4.4,
              "reviewCount": 4600,
              "price": "₹600–1600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Best Value",
              "reasoning": "Reliable Italian with fresh pasta and arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16009431744234430740",
                "phone": "072592 32851"
              },
              "raw": "<card title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\"><badge>Best Value</badge><rating>4.4★ · 4.6k reviews</rating><price>₹600–1600 per person</price><why>Reliable Italian with fresh pasta and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg\"/><cta>https://maps.google.com/?cid=16009431744234430740</cta><phone>072592 32851</phone></card>"
            }
          ],
          "emphasisIds": [
            "entity-57",
            "entity-58",
            "entity-59"
          ]
        },
        "confidence": "medium",
        "enterDuration": 750,
        "holdDuration": 2650,
        "exitDuration": 300
      },
      {
        "id": "cr-6-narrow",
        "visibility": "canvas_value",
        "narration": "3 stand out",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-57",
              "type": "generic",
              "title": "Si Nonna's, Koramangala",
              "externalId": "ChIJuf5upEkVrjsRRyieAsaJl5U",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg",
              "rating": 4.8,
              "reviewCount": 1400,
              "price": "₹400–1600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Top Pick",
              "reasoning": "Known for crispy sourdough pizza and arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=10779235716675020871",
                "phone": "079777 78047"
              },
              "raw": "<card title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\"><badge>Top Pick</badge><rating>4.8★ · 1.4k reviews</rating><price>₹400–1600 per person</price><why>Known for crispy sourdough pizza and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg\"/><cta>https://maps.google.com/?cid=10779235716675020871</cta><phone>079777 78047</phone></card>"
            },
            {
              "id": "entity-58",
              "type": "generic",
              "title": "Gnovi, Jayanagar",
              "externalId": "ChIJwZWoZQAVrjsRWiHAdeNWutI",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg",
              "rating": 4.6,
              "reviewCount": 386,
              "price": "₹600–1400 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Hidden Gem",
              "reasoning": "Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15184544628566139226",
                "phone": "083480 50003"
              },
              "raw": "<card title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\"><badge>Hidden Gem</badge><rating>4.6★ · 386 reviews</rating><price>₹600–1400 per person</price><why>Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg\"/><cta>https://maps.google.com/?cid=15184544628566139226</cta><phone>083480 50003</phone></card>"
            },
            {
              "id": "entity-59",
              "type": "generic",
              "title": "Chianti, Koramangala",
              "externalId": "ChIJwTjQW0EUrjsRIRf9d3YjyK4",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg",
              "rating": 4.5,
              "reviewCount": 6500,
              "availability": "Open till 10:30 PM",
              "judgment": "Crowd Favourite",
              "reasoning": "Classic Italian with warm ambiance and arancini; open till 10:30 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=12594355349667780385",
                "phone": "080 4113 2021"
              },
              "raw": "<card title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\"><badge>Crowd Favourite</badge><rating>4.5★ · 6.5k reviews</rating><why>Classic Italian with warm ambiance and arancini; open till 10:30 PM.</why><hours>Open till 10:30 PM</hours><visual query=\"\" title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg\"/><cta>https://maps.google.com/?cid=12594355349667780385</cta><phone>080 4113 2021</phone></card>"
            },
            {
              "id": "entity-60",
              "type": "generic",
              "title": "Pasta Street, Koramangala",
              "externalId": "ChIJEfXy3cIVrjsRFKH0ilntLN4",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg",
              "rating": 4.4,
              "reviewCount": 4600,
              "price": "₹600–1600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Best Value",
              "reasoning": "Reliable Italian with fresh pasta and arancini; open till 11 PM.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16009431744234430740",
                "phone": "072592 32851"
              },
              "raw": "<card title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\"><badge>Best Value</badge><rating>4.4★ · 4.6k reviews</rating><price>₹600–1600 per person</price><why>Reliable Italian with fresh pasta and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg\"/><cta>https://maps.google.com/?cid=16009431744234430740</cta><phone>072592 32851</phone></card>"
            }
          ],
          "emphasisIds": [
            "entity-57",
            "entity-58",
            "entity-59"
          ],
          "canvas": [
            {
              "type": "SHORTLIST_ITEMS",
              "ids": [
                "entity-57",
                "entity-58",
                "entity-59"
              ]
            }
          ]
        },
        "confidence": "medium",
        "enterDuration": 850,
        "holdDuration": 2550,
        "exitDuration": 300
      },
      {
        "id": "cr-7-complete",
        "visibility": "status",
        "narration": "Here's what stood out.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Get directions to Si Nonna's",
        "Check tonight's weather",
        "Find late-night dessert spots",
        "See reviews for Gnovi"
      ],
      "kind": "entity_rail",
      "headline": "Si Nonna's, Koramangala looks like your best fit",
      "entities": [
        {
          "id": "entity-57",
          "type": "generic",
          "title": "Si Nonna's, Koramangala",
          "externalId": "ChIJuf5upEkVrjsRRyieAsaJl5U",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg",
          "rating": 4.8,
          "reviewCount": 1400,
          "price": "₹400–1600 per person",
          "availability": "Open till 11:00 PM",
          "judgment": "Top Pick",
          "reasoning": "Known for crispy sourdough pizza and arancini; open till 11 PM.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=10779235716675020871",
            "phone": "079777 78047"
          },
          "raw": "<card title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\"><badge>Top Pick</badge><rating>4.8★ · 1.4k reviews</rating><price>₹400–1600 per person</price><why>Known for crispy sourdough pizza and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Si Nonna's, Koramangala\" place_id=\"ChIJuf5upEkVrjsRRyieAsaJl5U\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/sinonnas.jpg\"/><cta>https://maps.google.com/?cid=10779235716675020871</cta><phone>079777 78047</phone></card>"
        },
        {
          "id": "entity-58",
          "type": "generic",
          "title": "Gnovi, Jayanagar",
          "externalId": "ChIJwZWoZQAVrjsRWiHAdeNWutI",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg",
          "rating": 4.6,
          "reviewCount": 386,
          "price": "₹600–1400 per person",
          "availability": "Open till 11:00 PM",
          "judgment": "Hidden Gem",
          "reasoning": "Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=15184544628566139226",
            "phone": "083480 50003"
          },
          "raw": "<card title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\"><badge>Hidden Gem</badge><rating>4.6★ · 386 reviews</rating><price>₹600–1400 per person</price><why>Cozy Italian spot with excellent antipasti including arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Gnovi, Jayanagar\" place_id=\"ChIJwZWoZQAVrjsRWiHAdeNWutI\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gnovi.jpg\"/><cta>https://maps.google.com/?cid=15184544628566139226</cta><phone>083480 50003</phone></card>"
        },
        {
          "id": "entity-59",
          "type": "generic",
          "title": "Chianti, Koramangala",
          "externalId": "ChIJwTjQW0EUrjsRIRf9d3YjyK4",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg",
          "rating": 4.5,
          "reviewCount": 6500,
          "availability": "Open till 10:30 PM",
          "judgment": "Crowd Favourite",
          "reasoning": "Classic Italian with warm ambiance and arancini; open till 10:30 PM.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=12594355349667780385",
            "phone": "080 4113 2021"
          },
          "raw": "<card title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\"><badge>Crowd Favourite</badge><rating>4.5★ · 6.5k reviews</rating><why>Classic Italian with warm ambiance and arancini; open till 10:30 PM.</why><hours>Open till 10:30 PM</hours><visual query=\"\" title=\"Chianti, Koramangala\" place_id=\"ChIJwTjQW0EUrjsRIRf9d3YjyK4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chianti.jpg\"/><cta>https://maps.google.com/?cid=12594355349667780385</cta><phone>080 4113 2021</phone></card>"
        },
        {
          "id": "entity-60",
          "type": "generic",
          "title": "Pasta Street, Koramangala",
          "externalId": "ChIJEfXy3cIVrjsRFKH0ilntLN4",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg",
          "rating": 4.4,
          "reviewCount": 4600,
          "price": "₹600–1600 per person",
          "availability": "Open till 11:00 PM",
          "judgment": "Best Value",
          "reasoning": "Reliable Italian with fresh pasta and arancini; open till 11 PM.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=16009431744234430740",
            "phone": "072592 32851"
          },
          "raw": "<card title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\"><badge>Best Value</badge><rating>4.4★ · 4.6k reviews</rating><price>₹600–1600 per person</price><why>Reliable Italian with fresh pasta and arancini; open till 11 PM.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Pasta Street, Koramangala\" place_id=\"ChIJEfXy3cIVrjsRFKH0ilntLN4\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/pastastreet.jpg\"/><cta>https://maps.google.com/?cid=16009431744234430740</cta><phone>072592 32851</phone></card>"
        }
      ],
      "winnerId": "entity-57",
      "winnerRationale": "Known for crispy sourdough pizza and arancini; open till 11 PM.",
      "actions": {
        "entity-57": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=10779235716675020871",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-58": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=15184544628566139226",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-59": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=12594355349667780385",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-60": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=16009431744234430740",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ]
      }
    },
    "classification": {
      "prompt": "Find arancini restaurants near me that are open late.",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": true,
      "outputShape": "place_card",
      "archetype": "candidate_ranking",
      "confidence": "high",
      "signals": [
        "Explicit winner signal on \"Si Nonna's, Koramangala\" (badge: Top Pick).",
        "4 comparable entities, 0 supporting block(s).",
        "1 search/retrieval call(s).",
        "4 enrichment call(s)."
      ],
      "entityCount": 4
    },
    "requirements": {
      "entityType": "restaurant",
      "requestedAttributes": [
        "location"
      ],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": true,
      "explanationIntent": false,
      "matchedPhrases": [
        "near me",
        "find"
      ]
    },
    "metadata": {
      "toolSequence": [
        "PlaceSearch",
        "PlaceDetails",
        "PlaceDetails",
        "PlaceDetails",
        "PlaceDetails"
      ],
      "skills": [
        "default",
        "food"
      ],
      "latencyMs": 25192,
      "entityCount": 4,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-28",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-29",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-30",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-31",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-32",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 27,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 23504,
      "captureId": "q06",
      "captureLabel": "Late-Night Arancini"
    }
  },
  {
    "id": "harness-q07",
    "archetype": "candidate_ranking",
    "prompt": "Find Lucknowi Biryani restaurants near me.",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q07",
    "thinkingPasses": [
      {
        "id": "cr-1-acknowledge",
        "visibility": "canvas_value",
        "narration": "Got it — looking for the strongest options.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1350,
        "exitDuration": 250,
        "valueType": "intent",
        "payload": {
          "chips": [
            "Lucknowi Biryani",
            "Restaurant",
            "Near me",
            "Multiple options",
            "Location"
          ]
        }
      },
      {
        "id": "cr-2-sources",
        "visibility": "status",
        "narration": "Looking at what maps has nearby",
        "confidence": "high",
        "enterDuration": 800,
        "holdDuration": 2200,
        "exitDuration": 300
      },
      {
        "id": "cr-3-found",
        "visibility": "canvas_value",
        "narration": "Spotted 4 promising restaurants",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-65",
              "type": "generic",
              "title": "Lucknow Street, Indiranagar",
              "externalId": "ChIJkYL5WAAVrjsRbiB5uuoqaAA",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg",
              "rating": 4.5,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Top Pick",
              "reasoning": "Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=29320585217122414",
                "phone": "097395 43030"
              },
              "raw": "<card title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\"><badge>Top Pick</badge><rating>4.5★ · 49 reviews</rating><price>₹400–600 per person</price><why>Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg\"/><cta>https://maps.google.com/?cid=29320585217122414</cta><phone>097395 43030</phone></card>"
            },
            {
              "id": "entity-66",
              "type": "generic",
              "title": "Aromas of Biryani, Jayanagar",
              "externalId": "ChIJHW8IO-4VrjsRoJ7edhT4kdA",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg",
              "rating": 4.4,
              "reviewCount": 3000,
              "price": "₹200–600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Family Favorite",
              "reasoning": "Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15029066198289391264",
                "phone": "096064 51100"
              },
              "raw": "<card title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\"><badge>Family Favorite</badge><rating>4.4★ · 3k reviews</rating><price>₹200–600 per person</price><why>Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg\"/><cta>https://maps.google.com/?cid=15029066198289391264</cta><phone>096064 51100</phone></card>"
            },
            {
              "id": "entity-67",
              "type": "generic",
              "title": "Luckhnow Street, Koramangala",
              "externalId": "ChIJ3cq6Rk4UrjsRUMS70QMMs0s",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg",
              "rating": 3.9,
              "reviewCount": 3700,
              "price": "₹200–400 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Authentic Flavors",
              "reasoning": "Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=5454716784218981456",
                "phone": "097315 53030"
              },
              "raw": "<card title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\"><badge>Authentic Flavors</badge><rating>3.9★ · 3.7k reviews</rating><price>₹200–400 per person</price><why>Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg\"/><cta>https://maps.google.com/?cid=5454716784218981456</cta><phone>097315 53030</phone></card>"
            },
            {
              "id": "entity-68",
              "type": "generic",
              "title": "RNR Biryani, Jayanagar",
              "externalId": "ChIJ4SOBNhwVrjsRJf8wyc6izjk",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg",
              "rating": 4.3,
              "reviewCount": 6900,
              "price": "₹200–600 per person",
              "availability": "Open till 11:30 PM",
              "judgment": "Donne Style",
              "reasoning": "Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=4165445714386681637",
                "phone": "097427 21949"
              },
              "raw": "<card title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\"><badge>Donne Style</badge><rating>4.3★ · 6.9k reviews</rating><price>₹200–600 per person</price><why>Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg\"/><cta>https://maps.google.com/?cid=4165445714386681637</cta><phone>097427 21949</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "entity-65",
                  "type": "generic",
                  "title": "Lucknow Street, Indiranagar",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-66",
                  "type": "generic",
                  "title": "Aromas of Biryani, Jayanagar",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-67",
                  "type": "generic",
                  "title": "Luckhnow Street, Koramangala",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-68",
                  "type": "generic",
                  "title": "RNR Biryani, Jayanagar",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg",
                  "state": "discovered",
                  "metadata": {}
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-11"
        ],
        "confidence": "high",
        "debug": {
          "narrationCount": 4,
          "visibleCandidateCount": 4,
          "canonicalCandidateCount": 4,
          "discoveryExtracted": 8,
          "finalResponseExtracted": 4,
          "entitySource": "final_response_backfill",
          "subsetSource": "inferred_from_final_order",
          "imagesAvailable": 4,
          "coordinatesAvailable": 0
        },
        "enterDuration": 950,
        "holdDuration": 2500,
        "exitDuration": 300,
        "traceTiming": {
          "start": 6313,
          "end": 6675.5
        }
      },
      {
        "id": "cr-5-compare",
        "visibility": "canvas_value",
        "narration": "Seeing how they stack up",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-65",
              "type": "generic",
              "title": "Lucknow Street, Indiranagar",
              "externalId": "ChIJkYL5WAAVrjsRbiB5uuoqaAA",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg",
              "rating": 4.5,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Top Pick",
              "reasoning": "Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=29320585217122414",
                "phone": "097395 43030"
              },
              "raw": "<card title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\"><badge>Top Pick</badge><rating>4.5★ · 49 reviews</rating><price>₹400–600 per person</price><why>Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg\"/><cta>https://maps.google.com/?cid=29320585217122414</cta><phone>097395 43030</phone></card>"
            },
            {
              "id": "entity-66",
              "type": "generic",
              "title": "Aromas of Biryani, Jayanagar",
              "externalId": "ChIJHW8IO-4VrjsRoJ7edhT4kdA",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg",
              "rating": 4.4,
              "reviewCount": 3000,
              "price": "₹200–600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Family Favorite",
              "reasoning": "Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15029066198289391264",
                "phone": "096064 51100"
              },
              "raw": "<card title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\"><badge>Family Favorite</badge><rating>4.4★ · 3k reviews</rating><price>₹200–600 per person</price><why>Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg\"/><cta>https://maps.google.com/?cid=15029066198289391264</cta><phone>096064 51100</phone></card>"
            },
            {
              "id": "entity-67",
              "type": "generic",
              "title": "Luckhnow Street, Koramangala",
              "externalId": "ChIJ3cq6Rk4UrjsRUMS70QMMs0s",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg",
              "rating": 3.9,
              "reviewCount": 3700,
              "price": "₹200–400 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Authentic Flavors",
              "reasoning": "Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=5454716784218981456",
                "phone": "097315 53030"
              },
              "raw": "<card title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\"><badge>Authentic Flavors</badge><rating>3.9★ · 3.7k reviews</rating><price>₹200–400 per person</price><why>Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg\"/><cta>https://maps.google.com/?cid=5454716784218981456</cta><phone>097315 53030</phone></card>"
            },
            {
              "id": "entity-68",
              "type": "generic",
              "title": "RNR Biryani, Jayanagar",
              "externalId": "ChIJ4SOBNhwVrjsRJf8wyc6izjk",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg",
              "rating": 4.3,
              "reviewCount": 6900,
              "price": "₹200–600 per person",
              "availability": "Open till 11:30 PM",
              "judgment": "Donne Style",
              "reasoning": "Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=4165445714386681637",
                "phone": "097427 21949"
              },
              "raw": "<card title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\"><badge>Donne Style</badge><rating>4.3★ · 6.9k reviews</rating><price>₹200–600 per person</price><why>Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg\"/><cta>https://maps.google.com/?cid=4165445714386681637</cta><phone>097427 21949</phone></card>"
            }
          ],
          "emphasisIds": [
            "entity-65",
            "entity-66",
            "entity-68"
          ]
        },
        "confidence": "medium",
        "enterDuration": 750,
        "holdDuration": 2650,
        "exitDuration": 300
      },
      {
        "id": "cr-6-narrow",
        "visibility": "canvas_value",
        "narration": "3 really stand out",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-65",
              "type": "generic",
              "title": "Lucknow Street, Indiranagar",
              "externalId": "ChIJkYL5WAAVrjsRbiB5uuoqaAA",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg",
              "rating": 4.5,
              "reviewCount": 49,
              "price": "₹400–600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Top Pick",
              "reasoning": "Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=29320585217122414",
                "phone": "097395 43030"
              },
              "raw": "<card title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\"><badge>Top Pick</badge><rating>4.5★ · 49 reviews</rating><price>₹400–600 per person</price><why>Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg\"/><cta>https://maps.google.com/?cid=29320585217122414</cta><phone>097395 43030</phone></card>"
            },
            {
              "id": "entity-66",
              "type": "generic",
              "title": "Aromas of Biryani, Jayanagar",
              "externalId": "ChIJHW8IO-4VrjsRoJ7edhT4kdA",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg",
              "rating": 4.4,
              "reviewCount": 3000,
              "price": "₹200–600 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Family Favorite",
              "reasoning": "Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=15029066198289391264",
                "phone": "096064 51100"
              },
              "raw": "<card title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\"><badge>Family Favorite</badge><rating>4.4★ · 3k reviews</rating><price>₹200–600 per person</price><why>Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg\"/><cta>https://maps.google.com/?cid=15029066198289391264</cta><phone>096064 51100</phone></card>"
            },
            {
              "id": "entity-67",
              "type": "generic",
              "title": "Luckhnow Street, Koramangala",
              "externalId": "ChIJ3cq6Rk4UrjsRUMS70QMMs0s",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg",
              "rating": 3.9,
              "reviewCount": 3700,
              "price": "₹200–400 per person",
              "availability": "Open till 11:00 PM",
              "judgment": "Authentic Flavors",
              "reasoning": "Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=5454716784218981456",
                "phone": "097315 53030"
              },
              "raw": "<card title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\"><badge>Authentic Flavors</badge><rating>3.9★ · 3.7k reviews</rating><price>₹200–400 per person</price><why>Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg\"/><cta>https://maps.google.com/?cid=5454716784218981456</cta><phone>097315 53030</phone></card>"
            },
            {
              "id": "entity-68",
              "type": "generic",
              "title": "RNR Biryani, Jayanagar",
              "externalId": "ChIJ4SOBNhwVrjsRJf8wyc6izjk",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg",
              "rating": 4.3,
              "reviewCount": 6900,
              "price": "₹200–600 per person",
              "availability": "Open till 11:30 PM",
              "judgment": "Donne Style",
              "reasoning": "Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=4165445714386681637",
                "phone": "097427 21949"
              },
              "raw": "<card title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\"><badge>Donne Style</badge><rating>4.3★ · 6.9k reviews</rating><price>₹200–600 per person</price><why>Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg\"/><cta>https://maps.google.com/?cid=4165445714386681637</cta><phone>097427 21949</phone></card>"
            }
          ],
          "emphasisIds": [
            "entity-65",
            "entity-66",
            "entity-68"
          ],
          "canvas": [
            {
              "type": "SHORTLIST_ITEMS",
              "ids": [
                "entity-65",
                "entity-66",
                "entity-68"
              ]
            }
          ]
        },
        "confidence": "medium",
        "enterDuration": 850,
        "holdDuration": 2550,
        "exitDuration": 300
      },
      {
        "id": "cr-7-complete",
        "visibility": "status",
        "narration": "I've got the strongest options.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Get directions to Lucknow Street",
        "Check reviews for Aromas of Biryani",
        "Find vegetarian biryani options",
        "See weather for this evening"
      ],
      "kind": "entity_rail",
      "headline": "Lucknow Street, Indiranagar looks like your best fit",
      "entities": [
        {
          "id": "entity-65",
          "type": "generic",
          "title": "Lucknow Street, Indiranagar",
          "externalId": "ChIJkYL5WAAVrjsRbiB5uuoqaAA",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg",
          "rating": 4.5,
          "reviewCount": 49,
          "price": "₹400–600 per person",
          "availability": "Open till 11:00 PM",
          "judgment": "Top Pick",
          "reasoning": "Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=29320585217122414",
            "phone": "097395 43030"
          },
          "raw": "<card title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\"><badge>Top Pick</badge><rating>4.5★ · 49 reviews</rating><price>₹400–600 per person</price><why>Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Lucknow Street, Indiranagar\" place_id=\"ChIJkYL5WAAVrjsRbiB5uuoqaAA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreetindira.jpg\"/><cta>https://maps.google.com/?cid=29320585217122414</cta><phone>097395 43030</phone></card>"
        },
        {
          "id": "entity-66",
          "type": "generic",
          "title": "Aromas of Biryani, Jayanagar",
          "externalId": "ChIJHW8IO-4VrjsRoJ7edhT4kdA",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg",
          "rating": 4.4,
          "reviewCount": 3000,
          "price": "₹200–600 per person",
          "availability": "Open till 11:00 PM",
          "judgment": "Family Favorite",
          "reasoning": "Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=15029066198289391264",
            "phone": "096064 51100"
          },
          "raw": "<card title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\"><badge>Family Favorite</badge><rating>4.4★ · 3k reviews</rating><price>₹200–600 per person</price><why>Mild spice level, generous potatoes, subtle rose water notes, and spacious AC seating for families.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Aromas of Biryani, Jayanagar\" place_id=\"ChIJHW8IO-4VrjsRoJ7edhT4kdA\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/aromasofbiryani.jpg\"/><cta>https://maps.google.com/?cid=15029066198289391264</cta><phone>096064 51100</phone></card>"
        },
        {
          "id": "entity-67",
          "type": "generic",
          "title": "Luckhnow Street, Koramangala",
          "externalId": "ChIJ3cq6Rk4UrjsRUMS70QMMs0s",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg",
          "rating": 3.9,
          "reviewCount": 3700,
          "price": "₹200–400 per person",
          "availability": "Open till 11:00 PM",
          "judgment": "Authentic Flavors",
          "reasoning": "Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=5454716784218981456",
            "phone": "097315 53030"
          },
          "raw": "<card title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\"><badge>Authentic Flavors</badge><rating>3.9★ · 3.7k reviews</rating><price>₹200–400 per person</price><why>Classic Lucknowi style with tender meat, mild spice, and a casual family vibe at great value.</why><hours>Open till 11:00 PM</hours><visual query=\"\" title=\"Luckhnow Street, Koramangala\" place_id=\"ChIJ3cq6Rk4UrjsRUMS70QMMs0s\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/lucknowstreet.jpg\"/><cta>https://maps.google.com/?cid=5454716784218981456</cta><phone>097315 53030</phone></card>"
        },
        {
          "id": "entity-68",
          "type": "generic",
          "title": "RNR Biryani, Jayanagar",
          "externalId": "ChIJ4SOBNhwVrjsRJf8wyc6izjk",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg",
          "rating": 4.3,
          "reviewCount": 6900,
          "price": "₹200–600 per person",
          "availability": "Open till 11:30 PM",
          "judgment": "Donne Style",
          "reasoning": "Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=4165445714386681637",
            "phone": "097427 21949"
          },
          "raw": "<card title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\"><badge>Donne Style</badge><rating>4.3★ · 6.9k reviews</rating><price>₹200–600 per person</price><why>Traditional Donne Biryani with aromatic spices, potatoes, and a warm family atmosphere.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"RNR Biryani, Jayanagar\" place_id=\"ChIJ4SOBNhwVrjsRJf8wyc6izjk\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/rnrbiryani.jpg\"/><cta>https://maps.google.com/?cid=4165445714386681637</cta><phone>097427 21949</phone></card>"
        }
      ],
      "winnerId": "entity-65",
      "winnerRationale": "Authentic Lucknowi flavors with mild spice, rose water aroma, and a family-friendly upscale ambiance.",
      "actions": {
        "entity-65": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=29320585217122414",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-66": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=15029066198289391264",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-67": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=5454716784218981456",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-68": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=4165445714386681637",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ]
      }
    },
    "classification": {
      "prompt": "Find Lucknowi Biryani restaurants near me.",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": true,
      "outputShape": "place_card",
      "archetype": "candidate_ranking",
      "confidence": "high",
      "signals": [
        "Explicit winner signal on \"Lucknow Street, Indiranagar\" (badge: Top Pick).",
        "4 comparable entities, 0 supporting block(s).",
        "1 search/retrieval call(s).",
        "4 enrichment call(s)."
      ],
      "entityCount": 4
    },
    "requirements": {
      "entityType": "restaurant",
      "requestedAttributes": [
        "location"
      ],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": true,
      "explanationIntent": false,
      "matchedPhrases": [
        "near me",
        "find"
      ]
    },
    "metadata": {
      "toolSequence": [
        "PlaceSearch",
        "PlaceDetails",
        "PlaceDetails",
        "PlaceDetails",
        "PlaceDetails"
      ],
      "skills": [
        "default",
        "food"
      ],
      "latencyMs": 23581,
      "entityCount": 4,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-28",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-29",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-30",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-31",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-32",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 27,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 21883,
      "captureId": "q07",
      "captureLabel": "Lucknowi Biryani"
    }
  },
  {
    "id": "harness-q08",
    "archetype": "candidate_ranking",
    "prompt": "Help me discover hidden gems in Hoi An Ancient Town beyond the famous lanterns — hidden artisan workshops, lesser-known temples, contemporary creative spaces, and off-the-beaten-path spots.",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q08",
    "thinkingPasses": [
      {
        "id": "cr-1-acknowledge",
        "visibility": "canvas_value",
        "narration": "Got it — let's see what's out there.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1350,
        "exitDuration": 250,
        "valueType": "intent",
        "payload": {
          "chips": [
            "Hoi An Ancient Town"
          ]
        }
      },
      {
        "id": "cr-2-sources",
        "visibility": "status",
        "narration": "Checking places nearby on the map",
        "confidence": "high",
        "enterDuration": 800,
        "holdDuration": 2200,
        "exitDuration": 300
      },
      {
        "id": "cr-3-found",
        "visibility": "canvas_value",
        "narration": "Found 6 promising options",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-77",
              "type": "generic",
              "title": "Tu Hoian by Ledactu",
              "externalId": "ChIJ_bPIjKYPQjERx6f6bX0pawo",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg",
              "rating": 5,
              "reviewCount": 15,
              "judgment": "Hidden Gem",
              "reasoning": "A rooftop art gallery and cafe where local artists display work in a restored colonial house.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=750739381580113863",
                "phone": "0968 825 513"
              },
              "raw": "<card title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\"><badge>Hidden Gem</badge><rating>5★ (15 Reviews)</rating><why>A rooftop art gallery and cafe where local artists display work in a restored colonial house.</why><visual query=\"\" title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg\"/><cta>https://maps.google.com/?cid=750739381580113863</cta><phone>0968 825 513</phone></card>"
            },
            {
              "id": "entity-78",
              "type": "generic",
              "title": "HOIAN CRAFT SISTERS STUDIO",
              "externalId": "ChIJveISKVwPQjER_XlQJZ-3fAQ",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg",
              "rating": 5,
              "reviewCount": 44,
              "judgment": "Women-Led",
              "reasoning": "Empowers local women through silk lantern making and embroidery workshops in a family-run space.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=323335167417547261",
                "phone": "0327 735 472"
              },
              "raw": "<card title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\"><badge>Women-Led</badge><rating>5★ (44 Reviews)</rating><why>Empowers local women through silk lantern making and embroidery workshops in a family-run space.</why><visual query=\"\" title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg\"/><cta>https://maps.google.com/?cid=323335167417547261</cta><phone>0327 735 472</phone></card>"
            },
            {
              "id": "entity-79",
              "type": "generic",
              "title": "Quan Cong Temple",
              "externalId": "ChIJAR9RbH8OQjERKg6s43s5-_E",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg",
              "rating": 4.4,
              "reviewCount": 208,
              "judgment": "Serene",
              "reasoning": "Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17436593586558471722",
                "phone": "0971 198 995"
              },
              "raw": "<card title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\"><badge>Serene</badge><rating>4.4★ (208 Reviews)</rating><why>Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.</why><visual query=\"\" title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg\"/><cta>https://maps.google.com/?cid=17436593586558471722</cta><phone>0971 198 995</phone></card>"
            },
            {
              "id": "entity-80",
              "type": "generic",
              "title": "Chùa Phước Bảo",
              "externalId": "ChIJO0OxoH4OQjER1vMZNZh4tO0",
              "rating": 4.5,
              "reviewCount": 579,
              "judgment": "Local Favorite",
              "reasoning": "A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.",
              "attributes": {},
              "raw": "<card title=\"Chùa Phước Bảo\"><badge>Local Favorite</badge><rating>4.5★ (579 Reviews)</rating><why>A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.</why></card>"
            },
            {
              "id": "entity-81",
              "type": "generic",
              "title": "Cửi Lụa Art Space - Coco Casa",
              "rating": 4.9,
              "reviewCount": 149,
              "judgment": "Modern Art",
              "reasoning": "A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16408858790624894777",
                "phone": "0369 959 992"
              },
              "raw": "<card title=\"Cửi Lụa Art Space - Coco Casa\"><badge>Modern Art</badge><rating>4.9★ (149 Reviews)</rating><why>A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.</why><cta>https://maps.google.com/?cid=16408858790624894777</cta><phone>0369 959 992</phone></card>"
            },
            {
              "id": "entity-82",
              "type": "generic",
              "title": "Hub Hoi An Coworking",
              "externalId": "ChIJORIFYMMNQjERqvlJUXYYba0",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg",
              "rating": 4.8,
              "reviewCount": 224,
              "judgment": "Creative Hub",
              "reasoning": "A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=12496671437472004522",
                "phone": "0342 479 009"
              },
              "raw": "<card title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\"><badge>Creative Hub</badge><rating>4.8★ (224 Reviews)</rating><why>A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.</why><visual query=\"\" title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg\"/><cta>https://maps.google.com/?cid=12496671437472004522</cta><phone>0342 479 009</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "entity-77",
                  "type": "generic",
                  "title": "Tu Hoian by Ledactu",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-78",
                  "type": "generic",
                  "title": "HOIAN CRAFT SISTERS STUDIO",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-79",
                  "type": "generic",
                  "title": "Quan Cong Temple",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-80",
                  "type": "generic",
                  "title": "Chùa Phước Bảo",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-81",
                  "type": "generic",
                  "title": "Cửi Lụa Art Space - Coco Casa",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-82",
                  "type": "generic",
                  "title": "Hub Hoi An Coworking",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg",
                  "state": "discovered",
                  "metadata": {}
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-16",
          "hs-18",
          "hs-20",
          "hs-22"
        ],
        "confidence": "high",
        "debug": {
          "narrationCount": 6,
          "visibleCandidateCount": 6,
          "canonicalCandidateCount": 8,
          "discoveryExtracted": 8,
          "finalResponseExtracted": 8,
          "entitySource": "final_response_backfill",
          "subsetSource": "inferred_from_final_order",
          "imagesAvailable": 4,
          "coordinatesAvailable": 0
        },
        "enterDuration": 950,
        "holdDuration": 2500,
        "exitDuration": 300,
        "traceTiming": {
          "start": 8658.5,
          "end": 9495.5
        }
      },
      {
        "id": "cr-4-enrich",
        "visibility": "canvas_value",
        "narration": "Looking into ratings",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-77",
              "type": "generic",
              "title": "Tu Hoian by Ledactu",
              "externalId": "ChIJ_bPIjKYPQjERx6f6bX0pawo",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg",
              "rating": 5,
              "reviewCount": 15,
              "judgment": "Hidden Gem",
              "reasoning": "A rooftop art gallery and cafe where local artists display work in a restored colonial house.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=750739381580113863",
                "phone": "0968 825 513"
              },
              "raw": "<card title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\"><badge>Hidden Gem</badge><rating>5★ (15 Reviews)</rating><why>A rooftop art gallery and cafe where local artists display work in a restored colonial house.</why><visual query=\"\" title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg\"/><cta>https://maps.google.com/?cid=750739381580113863</cta><phone>0968 825 513</phone></card>"
            },
            {
              "id": "entity-78",
              "type": "generic",
              "title": "HOIAN CRAFT SISTERS STUDIO",
              "externalId": "ChIJveISKVwPQjER_XlQJZ-3fAQ",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg",
              "rating": 5,
              "reviewCount": 44,
              "judgment": "Women-Led",
              "reasoning": "Empowers local women through silk lantern making and embroidery workshops in a family-run space.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=323335167417547261",
                "phone": "0327 735 472"
              },
              "raw": "<card title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\"><badge>Women-Led</badge><rating>5★ (44 Reviews)</rating><why>Empowers local women through silk lantern making and embroidery workshops in a family-run space.</why><visual query=\"\" title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg\"/><cta>https://maps.google.com/?cid=323335167417547261</cta><phone>0327 735 472</phone></card>"
            },
            {
              "id": "entity-79",
              "type": "generic",
              "title": "Quan Cong Temple",
              "externalId": "ChIJAR9RbH8OQjERKg6s43s5-_E",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg",
              "rating": 4.4,
              "reviewCount": 208,
              "judgment": "Serene",
              "reasoning": "Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17436593586558471722",
                "phone": "0971 198 995"
              },
              "raw": "<card title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\"><badge>Serene</badge><rating>4.4★ (208 Reviews)</rating><why>Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.</why><visual query=\"\" title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg\"/><cta>https://maps.google.com/?cid=17436593586558471722</cta><phone>0971 198 995</phone></card>"
            },
            {
              "id": "entity-80",
              "type": "generic",
              "title": "Chùa Phước Bảo",
              "externalId": "ChIJO0OxoH4OQjER1vMZNZh4tO0",
              "rating": 4.5,
              "reviewCount": 579,
              "judgment": "Local Favorite",
              "reasoning": "A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.",
              "attributes": {},
              "raw": "<card title=\"Chùa Phước Bảo\"><badge>Local Favorite</badge><rating>4.5★ (579 Reviews)</rating><why>A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.</why></card>"
            },
            {
              "id": "entity-81",
              "type": "generic",
              "title": "Cửi Lụa Art Space - Coco Casa",
              "rating": 4.9,
              "reviewCount": 149,
              "judgment": "Modern Art",
              "reasoning": "A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16408858790624894777",
                "phone": "0369 959 992"
              },
              "raw": "<card title=\"Cửi Lụa Art Space - Coco Casa\"><badge>Modern Art</badge><rating>4.9★ (149 Reviews)</rating><why>A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.</why><cta>https://maps.google.com/?cid=16408858790624894777</cta><phone>0369 959 992</phone></card>"
            },
            {
              "id": "entity-82",
              "type": "generic",
              "title": "Hub Hoi An Coworking",
              "externalId": "ChIJORIFYMMNQjERqvlJUXYYba0",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg",
              "rating": 4.8,
              "reviewCount": 224,
              "judgment": "Creative Hub",
              "reasoning": "A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=12496671437472004522",
                "phone": "0342 479 009"
              },
              "raw": "<card title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\"><badge>Creative Hub</badge><rating>4.8★ (224 Reviews)</rating><why>A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.</why><visual query=\"\" title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg\"/><cta>https://maps.google.com/?cid=12496671437472004522</cta><phone>0342 479 009</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ENRICH_ITEMS",
              "patches": [
                {
                  "id": "entity-77",
                  "data": {
                    "rating": 5,
                    "reviewCount": 15
                  }
                },
                {
                  "id": "entity-78",
                  "data": {
                    "rating": 5,
                    "reviewCount": 44
                  }
                },
                {
                  "id": "entity-79",
                  "data": {
                    "rating": 4.4,
                    "reviewCount": 208
                  }
                },
                {
                  "id": "entity-80",
                  "data": {
                    "rating": 4.5,
                    "reviewCount": 579
                  }
                },
                {
                  "id": "entity-81",
                  "data": {
                    "rating": 4.9,
                    "reviewCount": 149
                  }
                },
                {
                  "id": "entity-82",
                  "data": {
                    "rating": 4.8,
                    "reviewCount": 224
                  }
                }
              ]
            }
          ]
        },
        "sourceEventIds": [],
        "confidence": "high",
        "enterDuration": 750,
        "holdDuration": 2650,
        "exitDuration": 300
      },
      {
        "id": "cr-5-compare-rating",
        "visibility": "canvas_value",
        "narration": "Looking at ratings",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-77",
              "type": "generic",
              "title": "Tu Hoian by Ledactu",
              "externalId": "ChIJ_bPIjKYPQjERx6f6bX0pawo",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg",
              "rating": 5,
              "reviewCount": 15,
              "judgment": "Hidden Gem",
              "reasoning": "A rooftop art gallery and cafe where local artists display work in a restored colonial house.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=750739381580113863",
                "phone": "0968 825 513"
              },
              "raw": "<card title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\"><badge>Hidden Gem</badge><rating>5★ (15 Reviews)</rating><why>A rooftop art gallery and cafe where local artists display work in a restored colonial house.</why><visual query=\"\" title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg\"/><cta>https://maps.google.com/?cid=750739381580113863</cta><phone>0968 825 513</phone></card>"
            },
            {
              "id": "entity-78",
              "type": "generic",
              "title": "HOIAN CRAFT SISTERS STUDIO",
              "externalId": "ChIJveISKVwPQjER_XlQJZ-3fAQ",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg",
              "rating": 5,
              "reviewCount": 44,
              "judgment": "Women-Led",
              "reasoning": "Empowers local women through silk lantern making and embroidery workshops in a family-run space.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=323335167417547261",
                "phone": "0327 735 472"
              },
              "raw": "<card title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\"><badge>Women-Led</badge><rating>5★ (44 Reviews)</rating><why>Empowers local women through silk lantern making and embroidery workshops in a family-run space.</why><visual query=\"\" title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg\"/><cta>https://maps.google.com/?cid=323335167417547261</cta><phone>0327 735 472</phone></card>"
            },
            {
              "id": "entity-79",
              "type": "generic",
              "title": "Quan Cong Temple",
              "externalId": "ChIJAR9RbH8OQjERKg6s43s5-_E",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg",
              "rating": 4.4,
              "reviewCount": 208,
              "judgment": "Serene",
              "reasoning": "Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17436593586558471722",
                "phone": "0971 198 995"
              },
              "raw": "<card title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\"><badge>Serene</badge><rating>4.4★ (208 Reviews)</rating><why>Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.</why><visual query=\"\" title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg\"/><cta>https://maps.google.com/?cid=17436593586558471722</cta><phone>0971 198 995</phone></card>"
            },
            {
              "id": "entity-80",
              "type": "generic",
              "title": "Chùa Phước Bảo",
              "externalId": "ChIJO0OxoH4OQjER1vMZNZh4tO0",
              "rating": 4.5,
              "reviewCount": 579,
              "judgment": "Local Favorite",
              "reasoning": "A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.",
              "attributes": {},
              "raw": "<card title=\"Chùa Phước Bảo\"><badge>Local Favorite</badge><rating>4.5★ (579 Reviews)</rating><why>A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.</why></card>"
            },
            {
              "id": "entity-81",
              "type": "generic",
              "title": "Cửi Lụa Art Space - Coco Casa",
              "rating": 4.9,
              "reviewCount": 149,
              "judgment": "Modern Art",
              "reasoning": "A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16408858790624894777",
                "phone": "0369 959 992"
              },
              "raw": "<card title=\"Cửi Lụa Art Space - Coco Casa\"><badge>Modern Art</badge><rating>4.9★ (149 Reviews)</rating><why>A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.</why><cta>https://maps.google.com/?cid=16408858790624894777</cta><phone>0369 959 992</phone></card>"
            },
            {
              "id": "entity-82",
              "type": "generic",
              "title": "Hub Hoi An Coworking",
              "externalId": "ChIJORIFYMMNQjERqvlJUXYYba0",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg",
              "rating": 4.8,
              "reviewCount": 224,
              "judgment": "Creative Hub",
              "reasoning": "A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=12496671437472004522",
                "phone": "0342 479 009"
              },
              "raw": "<card title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\"><badge>Creative Hub</badge><rating>4.8★ (224 Reviews)</rating><why>A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.</why><visual query=\"\" title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg\"/><cta>https://maps.google.com/?cid=12496671437472004522</cta><phone>0342 479 009</phone></card>"
            }
          ],
          "comparison": {
            "key": "rating",
            "label": "Rating",
            "scale": "numeric",
            "values": {
              "entity-77": {
                "display": "5★"
              },
              "entity-78": {
                "display": "5★"
              },
              "entity-79": {
                "display": "4.4★"
              },
              "entity-80": {
                "display": "4.5★"
              },
              "entity-81": {
                "display": "4.9★"
              },
              "entity-82": {
                "display": "4.8★"
              }
            },
            "step": 0,
            "stepCount": 1
          }
        },
        "confidence": "high",
        "enterDuration": 900,
        "holdDuration": 1550,
        "exitDuration": 250
      },
      {
        "id": "cr-6-narrow",
        "visibility": "canvas_value",
        "narration": "3 pull ahead of the rest",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-77",
              "type": "generic",
              "title": "Tu Hoian by Ledactu",
              "externalId": "ChIJ_bPIjKYPQjERx6f6bX0pawo",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg",
              "rating": 5,
              "reviewCount": 15,
              "judgment": "Hidden Gem",
              "reasoning": "A rooftop art gallery and cafe where local artists display work in a restored colonial house.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=750739381580113863",
                "phone": "0968 825 513"
              },
              "raw": "<card title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\"><badge>Hidden Gem</badge><rating>5★ (15 Reviews)</rating><why>A rooftop art gallery and cafe where local artists display work in a restored colonial house.</why><visual query=\"\" title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg\"/><cta>https://maps.google.com/?cid=750739381580113863</cta><phone>0968 825 513</phone></card>"
            },
            {
              "id": "entity-78",
              "type": "generic",
              "title": "HOIAN CRAFT SISTERS STUDIO",
              "externalId": "ChIJveISKVwPQjER_XlQJZ-3fAQ",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg",
              "rating": 5,
              "reviewCount": 44,
              "judgment": "Women-Led",
              "reasoning": "Empowers local women through silk lantern making and embroidery workshops in a family-run space.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=323335167417547261",
                "phone": "0327 735 472"
              },
              "raw": "<card title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\"><badge>Women-Led</badge><rating>5★ (44 Reviews)</rating><why>Empowers local women through silk lantern making and embroidery workshops in a family-run space.</why><visual query=\"\" title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg\"/><cta>https://maps.google.com/?cid=323335167417547261</cta><phone>0327 735 472</phone></card>"
            },
            {
              "id": "entity-79",
              "type": "generic",
              "title": "Quan Cong Temple",
              "externalId": "ChIJAR9RbH8OQjERKg6s43s5-_E",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg",
              "rating": 4.4,
              "reviewCount": 208,
              "judgment": "Serene",
              "reasoning": "Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17436593586558471722",
                "phone": "0971 198 995"
              },
              "raw": "<card title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\"><badge>Serene</badge><rating>4.4★ (208 Reviews)</rating><why>Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.</why><visual query=\"\" title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg\"/><cta>https://maps.google.com/?cid=17436593586558471722</cta><phone>0971 198 995</phone></card>"
            },
            {
              "id": "entity-80",
              "type": "generic",
              "title": "Chùa Phước Bảo",
              "externalId": "ChIJO0OxoH4OQjER1vMZNZh4tO0",
              "rating": 4.5,
              "reviewCount": 579,
              "judgment": "Local Favorite",
              "reasoning": "A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.",
              "attributes": {},
              "raw": "<card title=\"Chùa Phước Bảo\"><badge>Local Favorite</badge><rating>4.5★ (579 Reviews)</rating><why>A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.</why></card>"
            },
            {
              "id": "entity-81",
              "type": "generic",
              "title": "Cửi Lụa Art Space - Coco Casa",
              "rating": 4.9,
              "reviewCount": 149,
              "judgment": "Modern Art",
              "reasoning": "A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16408858790624894777",
                "phone": "0369 959 992"
              },
              "raw": "<card title=\"Cửi Lụa Art Space - Coco Casa\"><badge>Modern Art</badge><rating>4.9★ (149 Reviews)</rating><why>A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.</why><cta>https://maps.google.com/?cid=16408858790624894777</cta><phone>0369 959 992</phone></card>"
            },
            {
              "id": "entity-82",
              "type": "generic",
              "title": "Hub Hoi An Coworking",
              "externalId": "ChIJORIFYMMNQjERqvlJUXYYba0",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg",
              "rating": 4.8,
              "reviewCount": 224,
              "judgment": "Creative Hub",
              "reasoning": "A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=12496671437472004522",
                "phone": "0342 479 009"
              },
              "raw": "<card title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\"><badge>Creative Hub</badge><rating>4.8★ (224 Reviews)</rating><why>A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.</why><visual query=\"\" title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg\"/><cta>https://maps.google.com/?cid=12496671437472004522</cta><phone>0342 479 009</phone></card>"
            }
          ],
          "emphasisIds": [
            "entity-80",
            "entity-77",
            "entity-78"
          ],
          "canvas": [
            {
              "type": "SHORTLIST_ITEMS",
              "ids": [
                "entity-80",
                "entity-77",
                "entity-78"
              ]
            }
          ]
        },
        "confidence": "medium",
        "enterDuration": 850,
        "holdDuration": 2550,
        "exitDuration": 300
      },
      {
        "id": "cr-7-complete",
        "visibility": "status",
        "narration": "I've got the strongest options.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Book a lantern-making class",
        "Find restaurants near these spots",
        "Plan a 2-day Hoi An itinerary",
        "Best time to visit Hoi An"
      ],
      "kind": "entity_rail",
      "headline": "Start with a morning temple visit, spend the afternoon in a workshop, and end with a riverside sunset — that's how locals experience Hoi An.",
      "entities": [
        {
          "id": "entity-77",
          "type": "generic",
          "title": "Tu Hoian by Ledactu",
          "externalId": "ChIJ_bPIjKYPQjERx6f6bX0pawo",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg",
          "rating": 5,
          "reviewCount": 15,
          "judgment": "Hidden Gem",
          "reasoning": "A rooftop art gallery and cafe where local artists display work in a restored colonial house.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=750739381580113863",
            "phone": "0968 825 513"
          },
          "raw": "<card title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\"><badge>Hidden Gem</badge><rating>5★ (15 Reviews)</rating><why>A rooftop art gallery and cafe where local artists display work in a restored colonial house.</why><visual query=\"\" title=\"Tu Hoian by Ledactu\" place_id=\"ChIJ_bPIjKYPQjERx6f6bX0pawo\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/tuhoian.jpg\"/><cta>https://maps.google.com/?cid=750739381580113863</cta><phone>0968 825 513</phone></card>"
        },
        {
          "id": "entity-78",
          "type": "generic",
          "title": "HOIAN CRAFT SISTERS STUDIO",
          "externalId": "ChIJveISKVwPQjER_XlQJZ-3fAQ",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg",
          "rating": 5,
          "reviewCount": 44,
          "judgment": "Women-Led",
          "reasoning": "Empowers local women through silk lantern making and embroidery workshops in a family-run space.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=323335167417547261",
            "phone": "0327 735 472"
          },
          "raw": "<card title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\"><badge>Women-Led</badge><rating>5★ (44 Reviews)</rating><why>Empowers local women through silk lantern making and embroidery workshops in a family-run space.</why><visual query=\"\" title=\"HOIAN CRAFT SISTERS STUDIO\" place_id=\"ChIJveISKVwPQjER_XlQJZ-3fAQ\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/craftsisters.jpg\"/><cta>https://maps.google.com/?cid=323335167417547261</cta><phone>0327 735 472</phone></card>"
        },
        {
          "id": "entity-79",
          "type": "generic",
          "title": "Quan Cong Temple",
          "externalId": "ChIJAR9RbH8OQjERKg6s43s5-_E",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg",
          "rating": 4.4,
          "reviewCount": 208,
          "judgment": "Serene",
          "reasoning": "Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=17436593586558471722",
            "phone": "0971 198 995"
          },
          "raw": "<card title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\"><badge>Serene</badge><rating>4.4★ (208 Reviews)</rating><why>Dedicated to the legendary general Quan Cong, this quiet temple offers a peaceful escape from the Old Town bustle.</why><visual query=\"\" title=\"Quan Cong Temple\" place_id=\"ChIJAR9RbH8OQjERKg6s43s5-_E\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/quancong.jpg\"/><cta>https://maps.google.com/?cid=17436593586558471722</cta><phone>0971 198 995</phone></card>"
        },
        {
          "id": "entity-80",
          "type": "generic",
          "title": "Chùa Phước Bảo",
          "externalId": "ChIJO0OxoH4OQjER1vMZNZh4tO0",
          "rating": 4.5,
          "reviewCount": 579,
          "judgment": "Local Favorite",
          "reasoning": "A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.",
          "attributes": {},
          "raw": "<card title=\"Chùa Phước Bảo\"><badge>Local Favorite</badge><rating>4.5★ (579 Reviews)</rating><why>A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.</why></card>"
        },
        {
          "id": "entity-81",
          "type": "generic",
          "title": "Cửi Lụa Art Space - Coco Casa",
          "rating": 4.9,
          "reviewCount": 149,
          "judgment": "Modern Art",
          "reasoning": "A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=16408858790624894777",
            "phone": "0369 959 992"
          },
          "raw": "<card title=\"Cửi Lụa Art Space - Coco Casa\"><badge>Modern Art</badge><rating>4.9★ (149 Reviews)</rating><why>A contemporary gallery showcasing modern Vietnamese art alongside traditional silk crafts in a riverside setting.</why><cta>https://maps.google.com/?cid=16408858790624894777</cta><phone>0369 959 992</phone></card>"
        },
        {
          "id": "entity-82",
          "type": "generic",
          "title": "Hub Hoi An Coworking",
          "externalId": "ChIJORIFYMMNQjERqvlJUXYYba0",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg",
          "rating": 4.8,
          "reviewCount": 224,
          "judgment": "Creative Hub",
          "reasoning": "A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=12496671437472004522",
            "phone": "0342 479 009"
          },
          "raw": "<card title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\"><badge>Creative Hub</badge><rating>4.8★ (224 Reviews)</rating><why>A modern coworking space that hosts art exhibitions, cultural events, and community gatherings.</why><visual query=\"\" title=\"Hub Hoi An Coworking\" place_id=\"ChIJORIFYMMNQjERqvlJUXYYba0\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/hubhoian.jpg\"/><cta>https://maps.google.com/?cid=12496671437472004522</cta><phone>0342 479 009</phone></card>"
        },
        {
          "id": "entity-83",
          "type": "generic",
          "title": "Phố Cổ Hoi An (Old Town Core)",
          "rating": 4.7,
          "reviewCount": 514,
          "judgment": "Historic Heart",
          "reasoning": "Explore the narrow back alleys away from the main tourist drag to find authentic local life.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=16041945140456063900",
            "phone": "0347 544 312"
          },
          "raw": "<card title=\"Phố Cổ Hoi An (Old Town Core)\"><badge>Historic Heart</badge><rating>4.7★ (514 Reviews)</rating><why>Explore the narrow back alleys away from the main tourist drag to find authentic local life.</why><cta>https://maps.google.com/?cid=16041945140456063900</cta><phone>0347 544 312</phone></card>"
        },
        {
          "id": "entity-84",
          "type": "generic",
          "title": "Thu Bồn River",
          "externalId": "ChIJnfMm2BcPQjERjM-chdEObYs",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/thubon.jpg",
          "rating": 4.6,
          "reviewCount": 80,
          "judgment": "Riverside",
          "reasoning": "Take a quiet boat ride along the river at dawn or dusk to see the town from a different perspective.",
          "attributes": {},
          "raw": "<card title=\"Thu Bồn River\" place_id=\"ChIJnfMm2BcPQjERjM-chdEObYs\"><badge>Riverside</badge><rating>4.6★ (80 Reviews)</rating><why>Take a quiet boat ride along the river at dawn or dusk to see the town from a different perspective.</why><visual query=\"\" title=\"Thu Bồn River\" place_id=\"ChIJnfMm2BcPQjERjM-chdEObYs\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/thubon.jpg\"/></card>"
        }
      ],
      "winnerId": "entity-80",
      "winnerRationale": "A working Buddhist temple where you can observe daily rituals and admire traditional Vietnamese architecture.",
      "actions": {
        "entity-77": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=750739381580113863",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-78": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=323335167417547261",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-79": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=17436593586558471722",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-80": [],
        "entity-81": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=16408858790624894777",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-82": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=12496671437472004522",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-83": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=16041945140456063900",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-84": []
      }
    },
    "classification": {
      "prompt": "Help me discover hidden gems in Hoi An Ancient Town beyond the famous lanterns — hidden artisan workshops, lesser-known temples, contemporary creative spaces, and off-the-beaten-path spots.",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": false,
      "outputShape": "place_card",
      "archetype": "candidate_ranking",
      "confidence": "high",
      "signals": [
        "Explicit winner signal on \"Chùa Phước Bảo\" (badge: Local Favorite).",
        "8 comparable entities, 0 supporting block(s).",
        "4 search/retrieval call(s)."
      ],
      "entityCount": 8
    },
    "requirements": {
      "requestedAttributes": [],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": []
    },
    "metadata": {
      "toolSequence": [
        "PlaceSearch",
        "PlaceSearch",
        "PlaceSearch",
        "PlaceSearch"
      ],
      "skills": [
        "default",
        "local_experiences",
        "travel"
      ],
      "latencyMs": 31694,
      "entityCount": 8,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-11",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-24",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-26",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-28",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 24,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 30190,
      "captureId": "q08",
      "captureLabel": "Hidden Hoi An"
    }
  },
  {
    "id": "harness-q09",
    "archetype": "text_only",
    "prompt": "Start something new",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q09",
    "thinkingPasses": [
      {
        "id": "pass-1-discover",
        "visibility": "status",
        "narration": "Let me check what cricket matches are coming up next.",
        "sourceEventIds": [
          "hs-23"
        ],
        "sourceSpanIds": [
          "9cc6ac37-5987-4e1e-83c5-229925f664aa"
        ],
        "confidence": "high",
        "enterDuration": 500,
        "holdDuration": 1500,
        "exitDuration": 250,
        "traceTiming": {
          "start": 15376.5,
          "end": 16088
        }
      },
      {
        "id": "pass-synthesis",
        "visibility": "status",
        "narration": "Pulling the useful details into one clear answer",
        "confidence": "high",
        "enterDuration": 700,
        "holdDuration": 2400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Check T20 World Cup fixtures",
        "See Women's Premier League schedule",
        "Find live cricket scores now",
        "Look up past match results"
      ],
      "kind": "text",
      "headline": "No upcoming IPL matches right now.",
      "body": [
        "Want to check the T20 World Cup or Women's Premier League instead?"
      ]
    },
    "classification": {
      "prompt": "Start something new",
      "hasImages": false,
      "hasMapSignals": false,
      "hasStructuredData": false,
      "outputShape": "prose",
      "archetype": "text_only",
      "confidence": "medium",
      "signals": [
        "Prose answer with no peer entities, no route, no structured block.",
        "0 comparable entities, 0 supporting block(s).",
        "No usable image in the trace — must render image-free."
      ],
      "entityCount": 0
    },
    "requirements": {
      "requestedAttributes": [],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": []
    },
    "metadata": {
      "toolSequence": [
        "CricketEvents"
      ],
      "skills": [
        "default",
        "fashion",
        "sports"
      ],
      "latencyMs": 23241,
      "entityCount": 0,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-11",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-20",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-22",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-24",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-26",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-28",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-29",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-30",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-31",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 30,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 21696,
      "captureId": "q09",
      "captureLabel": "Start Something New"
    }
  },
  {
    "id": "harness-q10",
    "archetype": "candidate_ranking",
    "prompt": "I'm craving a delicate, melt-in-mouth tofu dish with fine threads in a clear soy broth tonight — where can I get authentic Wensi Tofu or Jiangsu-style tofu dishes near me?",
    "domain": "default",
    "source": "harness_stream",
    "traceId": "q10",
    "thinkingPasses": [
      {
        "id": "cr-1-acknowledge",
        "visibility": "canvas_value",
        "narration": "On it — finding the strongest options.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1350,
        "exitDuration": 250,
        "valueType": "intent",
        "payload": {
          "chips": [
            "Wensi Tofu",
            "Near me",
            "Location",
            "Timings"
          ]
        }
      },
      {
        "id": "cr-2-sources",
        "visibility": "status",
        "narration": "Scanning what's nearby on the map",
        "confidence": "high",
        "enterDuration": 800,
        "holdDuration": 2200,
        "exitDuration": 300
      },
      {
        "id": "cr-3-found",
        "visibility": "canvas_value",
        "narration": "Turned up 4 promising options",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-89",
              "type": "generic",
              "title": "Shang Palace, Vasanth Nagar",
              "externalId": "ChIJya3qua0XrjsRlaPDV2L8b-k",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg",
              "rating": 4.6,
              "reviewCount": 280,
              "price": "₹2000+ per person",
              "availability": "Open till 11:30 PM",
              "judgment": "Top Pick",
              "reasoning": "Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16820940632561525653",
                "phone": "080 4512 6440"
              },
              "raw": "<card title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\"><badge>Top Pick</badge><rating>4.6★ · 280 reviews</rating><price>₹2000+ per person</price><why>Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg\"/><cta>https://maps.google.com/?cid=16820940632561525653</cta><phone>080 4512 6440</phone></card>"
            },
            {
              "id": "entity-90",
              "type": "generic",
              "title": "Garden Asia Restaurant, Koramangala",
              "externalId": "ChIJKVDmPAkVrjsReCbEIhoCxKU",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg",
              "rating": 4.6,
              "reviewCount": 1600,
              "price": "₹200–1200 per person",
              "availability": "Open till 12:30 AM",
              "judgment": "Best Value",
              "reasoning": "Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=11944674422969083512",
                "phone": "078990 51989"
              },
              "raw": "<card title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\"><badge>Best Value</badge><rating>4.6★ · 1.6k reviews</rating><price>₹200–1200 per person</price><why>Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.</why><hours>Open till 12:30 AM</hours><visual query=\"\" title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg\"/><cta>https://maps.google.com/?cid=11944674422969083512</cta><phone>078990 51989</phone></card>"
            },
            {
              "id": "entity-91",
              "type": "generic",
              "title": "China Pearl, Koramangala",
              "externalId": "ChIJgwUaGEUUrjsRRTdbOTMrzco",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg",
              "rating": 4.3,
              "reviewCount": 5400,
              "price": "₹400–1200 per person",
              "availability": "Open till 10:45 PM",
              "judgment": "Local Favourite",
              "reasoning": "Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14613383864892733253",
                "phone": "080 4110 5060"
              },
              "raw": "<card title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\"><badge>Local Favourite</badge><rating>4.3★ · 5.4k reviews</rating><price>₹400–1200 per person</price><why>Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.</why><hours>Open till 10:45 PM</hours><visual query=\"\" title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg\"/><cta>https://maps.google.com/?cid=14613383864892733253</cta><phone>080 4110 5060</phone></card>"
            },
            {
              "id": "entity-92",
              "type": "generic",
              "title": "Chowman, Indiranagar",
              "externalId": "ChIJ696oNcURrjsR_R0muooPI-w",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg",
              "rating": 4.6,
              "reviewCount": 4600,
              "price": "₹400–1400 per person",
              "availability": "Open till 12:00 AM",
              "judgment": "Crowd Pleaser",
              "reasoning": "Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17015460905638829565",
                "phone": "093300 25661"
              },
              "raw": "<card title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\"><badge>Crowd Pleaser</badge><rating>4.6★ · 4.6k reviews</rating><price>₹400–1400 per person</price><why>Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.</why><hours>Open till 12:00 AM</hours><visual query=\"\" title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg\"/><cta>https://maps.google.com/?cid=17015460905638829565</cta><phone>093300 25661</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ADD_ITEMS",
              "items": [
                {
                  "id": "entity-89",
                  "type": "generic",
                  "title": "Shang Palace, Vasanth Nagar",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-90",
                  "type": "generic",
                  "title": "Garden Asia Restaurant, Koramangala",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-91",
                  "type": "generic",
                  "title": "China Pearl, Koramangala",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg",
                  "state": "discovered",
                  "metadata": {}
                },
                {
                  "id": "entity-92",
                  "type": "generic",
                  "title": "Chowman, Indiranagar",
                  "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg",
                  "state": "discovered",
                  "metadata": {}
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-11"
        ],
        "confidence": "high",
        "debug": {
          "narrationCount": 4,
          "visibleCandidateCount": 4,
          "canonicalCandidateCount": 4,
          "discoveryExtracted": 8,
          "finalResponseExtracted": 4,
          "entitySource": "final_response_backfill",
          "subsetSource": "inferred_from_final_order",
          "imagesAvailable": 4,
          "coordinatesAvailable": 0
        },
        "enterDuration": 950,
        "holdDuration": 2500,
        "exitDuration": 300,
        "traceTiming": {
          "start": 6403.5,
          "end": 7068
        }
      },
      {
        "id": "cr-4-enrich",
        "visibility": "canvas_value",
        "narration": "Checking timings",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-89",
              "type": "generic",
              "title": "Shang Palace, Vasanth Nagar",
              "externalId": "ChIJya3qua0XrjsRlaPDV2L8b-k",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg",
              "rating": 4.6,
              "reviewCount": 280,
              "price": "₹2000+ per person",
              "availability": "Open till 11:30 PM",
              "judgment": "Top Pick",
              "reasoning": "Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16820940632561525653",
                "phone": "080 4512 6440"
              },
              "raw": "<card title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\"><badge>Top Pick</badge><rating>4.6★ · 280 reviews</rating><price>₹2000+ per person</price><why>Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg\"/><cta>https://maps.google.com/?cid=16820940632561525653</cta><phone>080 4512 6440</phone></card>"
            },
            {
              "id": "entity-90",
              "type": "generic",
              "title": "Garden Asia Restaurant, Koramangala",
              "externalId": "ChIJKVDmPAkVrjsReCbEIhoCxKU",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg",
              "rating": 4.6,
              "reviewCount": 1600,
              "price": "₹200–1200 per person",
              "availability": "Open till 12:30 AM",
              "judgment": "Best Value",
              "reasoning": "Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=11944674422969083512",
                "phone": "078990 51989"
              },
              "raw": "<card title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\"><badge>Best Value</badge><rating>4.6★ · 1.6k reviews</rating><price>₹200–1200 per person</price><why>Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.</why><hours>Open till 12:30 AM</hours><visual query=\"\" title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg\"/><cta>https://maps.google.com/?cid=11944674422969083512</cta><phone>078990 51989</phone></card>"
            },
            {
              "id": "entity-91",
              "type": "generic",
              "title": "China Pearl, Koramangala",
              "externalId": "ChIJgwUaGEUUrjsRRTdbOTMrzco",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg",
              "rating": 4.3,
              "reviewCount": 5400,
              "price": "₹400–1200 per person",
              "availability": "Open till 10:45 PM",
              "judgment": "Local Favourite",
              "reasoning": "Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14613383864892733253",
                "phone": "080 4110 5060"
              },
              "raw": "<card title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\"><badge>Local Favourite</badge><rating>4.3★ · 5.4k reviews</rating><price>₹400–1200 per person</price><why>Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.</why><hours>Open till 10:45 PM</hours><visual query=\"\" title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg\"/><cta>https://maps.google.com/?cid=14613383864892733253</cta><phone>080 4110 5060</phone></card>"
            },
            {
              "id": "entity-92",
              "type": "generic",
              "title": "Chowman, Indiranagar",
              "externalId": "ChIJ696oNcURrjsR_R0muooPI-w",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg",
              "rating": 4.6,
              "reviewCount": 4600,
              "price": "₹400–1400 per person",
              "availability": "Open till 12:00 AM",
              "judgment": "Crowd Pleaser",
              "reasoning": "Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17015460905638829565",
                "phone": "093300 25661"
              },
              "raw": "<card title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\"><badge>Crowd Pleaser</badge><rating>4.6★ · 4.6k reviews</rating><price>₹400–1400 per person</price><why>Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.</why><hours>Open till 12:00 AM</hours><visual query=\"\" title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg\"/><cta>https://maps.google.com/?cid=17015460905638829565</cta><phone>093300 25661</phone></card>"
            }
          ],
          "canvas": [
            {
              "type": "ENRICH_ITEMS",
              "patches": [
                {
                  "id": "entity-89",
                  "data": {
                    "rating": 4.6,
                    "reviewCount": 280,
                    "priceLevel": "₹2000+ per person",
                    "availability": "Open till 11:30 PM"
                  }
                },
                {
                  "id": "entity-90",
                  "data": {
                    "rating": 4.6,
                    "reviewCount": 1600,
                    "priceLevel": "₹200–1200 per person",
                    "availability": "Open till 12:30 AM"
                  }
                },
                {
                  "id": "entity-91",
                  "data": {
                    "rating": 4.3,
                    "reviewCount": 5400,
                    "priceLevel": "₹400–1200 per person",
                    "availability": "Open till 10:45 PM"
                  }
                },
                {
                  "id": "entity-92",
                  "data": {
                    "rating": 4.6,
                    "reviewCount": 4600,
                    "priceLevel": "₹400–1400 per person",
                    "availability": "Open till 12:00 AM"
                  }
                }
              ]
            }
          ]
        },
        "sourceEventIds": [
          "hs-20",
          "hs-22",
          "hs-24",
          "hs-26"
        ],
        "confidence": "high",
        "enterDuration": 750,
        "holdDuration": 2650,
        "exitDuration": 300,
        "traceTiming": {
          "start": 11878.5,
          "end": 12512.5
        }
      },
      {
        "id": "cr-5-compare-availability",
        "visibility": "canvas_value",
        "narration": "Seeing what's actually open",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-89",
              "type": "generic",
              "title": "Shang Palace, Vasanth Nagar",
              "externalId": "ChIJya3qua0XrjsRlaPDV2L8b-k",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg",
              "rating": 4.6,
              "reviewCount": 280,
              "price": "₹2000+ per person",
              "availability": "Open till 11:30 PM",
              "judgment": "Top Pick",
              "reasoning": "Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16820940632561525653",
                "phone": "080 4512 6440"
              },
              "raw": "<card title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\"><badge>Top Pick</badge><rating>4.6★ · 280 reviews</rating><price>₹2000+ per person</price><why>Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg\"/><cta>https://maps.google.com/?cid=16820940632561525653</cta><phone>080 4512 6440</phone></card>"
            },
            {
              "id": "entity-90",
              "type": "generic",
              "title": "Garden Asia Restaurant, Koramangala",
              "externalId": "ChIJKVDmPAkVrjsReCbEIhoCxKU",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg",
              "rating": 4.6,
              "reviewCount": 1600,
              "price": "₹200–1200 per person",
              "availability": "Open till 12:30 AM",
              "judgment": "Best Value",
              "reasoning": "Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=11944674422969083512",
                "phone": "078990 51989"
              },
              "raw": "<card title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\"><badge>Best Value</badge><rating>4.6★ · 1.6k reviews</rating><price>₹200–1200 per person</price><why>Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.</why><hours>Open till 12:30 AM</hours><visual query=\"\" title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg\"/><cta>https://maps.google.com/?cid=11944674422969083512</cta><phone>078990 51989</phone></card>"
            },
            {
              "id": "entity-91",
              "type": "generic",
              "title": "China Pearl, Koramangala",
              "externalId": "ChIJgwUaGEUUrjsRRTdbOTMrzco",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg",
              "rating": 4.3,
              "reviewCount": 5400,
              "price": "₹400–1200 per person",
              "availability": "Open till 10:45 PM",
              "judgment": "Local Favourite",
              "reasoning": "Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14613383864892733253",
                "phone": "080 4110 5060"
              },
              "raw": "<card title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\"><badge>Local Favourite</badge><rating>4.3★ · 5.4k reviews</rating><price>₹400–1200 per person</price><why>Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.</why><hours>Open till 10:45 PM</hours><visual query=\"\" title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg\"/><cta>https://maps.google.com/?cid=14613383864892733253</cta><phone>080 4110 5060</phone></card>"
            },
            {
              "id": "entity-92",
              "type": "generic",
              "title": "Chowman, Indiranagar",
              "externalId": "ChIJ696oNcURrjsR_R0muooPI-w",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg",
              "rating": 4.6,
              "reviewCount": 4600,
              "price": "₹400–1400 per person",
              "availability": "Open till 12:00 AM",
              "judgment": "Crowd Pleaser",
              "reasoning": "Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17015460905638829565",
                "phone": "093300 25661"
              },
              "raw": "<card title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\"><badge>Crowd Pleaser</badge><rating>4.6★ · 4.6k reviews</rating><price>₹400–1400 per person</price><why>Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.</why><hours>Open till 12:00 AM</hours><visual query=\"\" title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg\"/><cta>https://maps.google.com/?cid=17015460905638829565</cta><phone>093300 25661</phone></card>"
            }
          ],
          "comparison": {
            "key": "availability",
            "label": "Availability",
            "scale": "text",
            "values": {
              "entity-89": {
                "display": "Open till 11:30 PM"
              },
              "entity-90": {
                "display": "Open till 12:30 AM"
              },
              "entity-91": {
                "display": "Open till 10:45 PM"
              },
              "entity-92": {
                "display": "Open till 12:00 AM"
              }
            },
            "step": 0,
            "stepCount": 1
          }
        },
        "confidence": "high",
        "enterDuration": 900,
        "holdDuration": 1550,
        "exitDuration": 250
      },
      {
        "id": "cr-6-narrow",
        "visibility": "canvas_value",
        "narration": "3 really stand out",
        "valueType": "entity_preview",
        "payload": {
          "entities": [
            {
              "id": "entity-89",
              "type": "generic",
              "title": "Shang Palace, Vasanth Nagar",
              "externalId": "ChIJya3qua0XrjsRlaPDV2L8b-k",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg",
              "rating": 4.6,
              "reviewCount": 280,
              "price": "₹2000+ per person",
              "availability": "Open till 11:30 PM",
              "judgment": "Top Pick",
              "reasoning": "Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=16820940632561525653",
                "phone": "080 4512 6440"
              },
              "raw": "<card title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\"><badge>Top Pick</badge><rating>4.6★ · 280 reviews</rating><price>₹2000+ per person</price><why>Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg\"/><cta>https://maps.google.com/?cid=16820940632561525653</cta><phone>080 4512 6440</phone></card>"
            },
            {
              "id": "entity-90",
              "type": "generic",
              "title": "Garden Asia Restaurant, Koramangala",
              "externalId": "ChIJKVDmPAkVrjsReCbEIhoCxKU",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg",
              "rating": 4.6,
              "reviewCount": 1600,
              "price": "₹200–1200 per person",
              "availability": "Open till 12:30 AM",
              "judgment": "Best Value",
              "reasoning": "Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=11944674422969083512",
                "phone": "078990 51989"
              },
              "raw": "<card title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\"><badge>Best Value</badge><rating>4.6★ · 1.6k reviews</rating><price>₹200–1200 per person</price><why>Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.</why><hours>Open till 12:30 AM</hours><visual query=\"\" title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg\"/><cta>https://maps.google.com/?cid=11944674422969083512</cta><phone>078990 51989</phone></card>"
            },
            {
              "id": "entity-91",
              "type": "generic",
              "title": "China Pearl, Koramangala",
              "externalId": "ChIJgwUaGEUUrjsRRTdbOTMrzco",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg",
              "rating": 4.3,
              "reviewCount": 5400,
              "price": "₹400–1200 per person",
              "availability": "Open till 10:45 PM",
              "judgment": "Local Favourite",
              "reasoning": "Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=14613383864892733253",
                "phone": "080 4110 5060"
              },
              "raw": "<card title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\"><badge>Local Favourite</badge><rating>4.3★ · 5.4k reviews</rating><price>₹400–1200 per person</price><why>Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.</why><hours>Open till 10:45 PM</hours><visual query=\"\" title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg\"/><cta>https://maps.google.com/?cid=14613383864892733253</cta><phone>080 4110 5060</phone></card>"
            },
            {
              "id": "entity-92",
              "type": "generic",
              "title": "Chowman, Indiranagar",
              "externalId": "ChIJ696oNcURrjsR_R0muooPI-w",
              "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg",
              "rating": 4.6,
              "reviewCount": 4600,
              "price": "₹400–1400 per person",
              "availability": "Open till 12:00 AM",
              "judgment": "Crowd Pleaser",
              "reasoning": "Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.",
              "attributes": {
                "ctaUrl": "https://maps.google.com/?cid=17015460905638829565",
                "phone": "093300 25661"
              },
              "raw": "<card title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\"><badge>Crowd Pleaser</badge><rating>4.6★ · 4.6k reviews</rating><price>₹400–1400 per person</price><why>Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.</why><hours>Open till 12:00 AM</hours><visual query=\"\" title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg\"/><cta>https://maps.google.com/?cid=17015460905638829565</cta><phone>093300 25661</phone></card>"
            }
          ],
          "emphasisIds": [
            "entity-89",
            "entity-90",
            "entity-92"
          ],
          "canvas": [
            {
              "type": "SHORTLIST_ITEMS",
              "ids": [
                "entity-89",
                "entity-90",
                "entity-92"
              ]
            }
          ]
        },
        "confidence": "medium",
        "enterDuration": 850,
        "holdDuration": 2550,
        "exitDuration": 300
      },
      {
        "id": "cr-7-complete",
        "visibility": "status",
        "narration": "That's the strongest set.",
        "confidence": "high",
        "enterDuration": 400,
        "holdDuration": 1400,
        "exitDuration": 300
      }
    ],
    "finalResponse": {
      "followUps": [
        "Only vegetarian options",
        "Reviews for Shang Palace",
        "What should I cook instead?",
        "Cozy indoor spots"
      ],
      "kind": "entity_rail",
      "headline": "Shang Palace, Vasanth Nagar looks like your best fit",
      "entities": [
        {
          "id": "entity-89",
          "type": "generic",
          "title": "Shang Palace, Vasanth Nagar",
          "externalId": "ChIJya3qua0XrjsRlaPDV2L8b-k",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg",
          "rating": 4.6,
          "reviewCount": 280,
          "price": "₹2000+ per person",
          "availability": "Open till 11:30 PM",
          "judgment": "Top Pick",
          "reasoning": "Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=16820940632561525653",
            "phone": "080 4512 6440"
          },
          "raw": "<card title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\"><badge>Top Pick</badge><rating>4.6★ · 280 reviews</rating><price>₹2000+ per person</price><why>Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.</why><hours>Open till 11:30 PM</hours><visual query=\"\" title=\"Shang Palace, Vasanth Nagar\" place_id=\"ChIJya3qua0XrjsRlaPDV2L8b-k\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/shangpalace.jpg\"/><cta>https://maps.google.com/?cid=16820940632561525653</cta><phone>080 4512 6440</phone></card>"
        },
        {
          "id": "entity-90",
          "type": "generic",
          "title": "Garden Asia Restaurant, Koramangala",
          "externalId": "ChIJKVDmPAkVrjsReCbEIhoCxKU",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg",
          "rating": 4.6,
          "reviewCount": 1600,
          "price": "₹200–1200 per person",
          "availability": "Open till 12:30 AM",
          "judgment": "Best Value",
          "reasoning": "Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=11944674422969083512",
            "phone": "078990 51989"
          },
          "raw": "<card title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\"><badge>Best Value</badge><rating>4.6★ · 1.6k reviews</rating><price>₹200–1200 per person</price><why>Known for delicate soups and tofu preparations; Chicken Wonton Soup and mocktails in a peaceful, late-night friendly ambiance.</why><hours>Open till 12:30 AM</hours><visual query=\"\" title=\"Garden Asia Restaurant, Koramangala\" place_id=\"ChIJKVDmPAkVrjsReCbEIhoCxKU\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/gardenasia.jpg\"/><cta>https://maps.google.com/?cid=11944674422969083512</cta><phone>078990 51989</phone></card>"
        },
        {
          "id": "entity-91",
          "type": "generic",
          "title": "China Pearl, Koramangala",
          "externalId": "ChIJgwUaGEUUrjsRRTdbOTMrzco",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg",
          "rating": 4.3,
          "reviewCount": 5400,
          "price": "₹400–1200 per person",
          "availability": "Open till 10:45 PM",
          "judgment": "Local Favourite",
          "reasoning": "Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=14613383864892733253",
            "phone": "080 4110 5060"
          },
          "raw": "<card title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\"><badge>Local Favourite</badge><rating>4.3★ · 5.4k reviews</rating><price>₹400–1200 per person</price><why>Traditional Hakka cuisine with generous portions; vegetarian-friendly with consistent, authentic flavours.</why><hours>Open till 10:45 PM</hours><visual query=\"\" title=\"China Pearl, Koramangala\" place_id=\"ChIJgwUaGEUUrjsRRTdbOTMrzco\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chinapearl.jpg\"/><cta>https://maps.google.com/?cid=14613383864892733253</cta><phone>080 4110 5060</phone></card>"
        },
        {
          "id": "entity-92",
          "type": "generic",
          "title": "Chowman, Indiranagar",
          "externalId": "ChIJ696oNcURrjsR_R0muooPI-w",
          "image": "https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg",
          "rating": 4.6,
          "reviewCount": 4600,
          "price": "₹400–1400 per person",
          "availability": "Open till 12:00 AM",
          "judgment": "Crowd Pleaser",
          "reasoning": "Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.",
          "attributes": {
            "ctaUrl": "https://maps.google.com/?cid=17015460905638829565",
            "phone": "093300 25661"
          },
          "raw": "<card title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\"><badge>Crowd Pleaser</badge><rating>4.6★ · 4.6k reviews</rating><price>₹400–1400 per person</price><why>Modern Chinese with spicy, fresh preparations; open till midnight on weekends for late-night dining.</why><hours>Open till 12:00 AM</hours><visual query=\"\" title=\"Chowman, Indiranagar\" place_id=\"ChIJ696oNcURrjsR_R0muooPI-w\" url=\"https://m-us-mob-ailooks-uat.glance-cdn.com/photo/chowman.jpg\"/><cta>https://maps.google.com/?cid=17015460905638829565</cta><phone>093300 25661</phone></card>"
        }
      ],
      "winnerId": "entity-89",
      "winnerRationale": "Authentic Guangdong & Sichuan cuisine; tofu dishes like Mapo Tofu and Sichuan Pepper Tofu are brilliant and unaltered for Indian palates.",
      "actions": {
        "entity-89": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=16820940632561525653",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-90": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=11944674422969083512",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-91": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=14613383864892733253",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ],
        "entity-92": [
          {
            "label": "Directions",
            "url": "https://maps.google.com/?cid=17015460905638829565",
            "intent": "directions"
          },
          {
            "label": "Call",
            "intent": "call"
          }
        ]
      }
    },
    "classification": {
      "prompt": "I'm craving a delicate, melt-in-mouth tofu dish with fine threads in a clear soy broth tonight — where can I get authentic Wensi Tofu or Jiangsu-style tofu dishes near me?",
      "hasImages": true,
      "hasMapSignals": false,
      "hasStructuredData": true,
      "outputShape": "place_card",
      "archetype": "candidate_ranking",
      "confidence": "high",
      "signals": [
        "Explicit winner signal on \"Shang Palace, Vasanth Nagar\" (badge: Top Pick).",
        "4 comparable entities, 0 supporting block(s).",
        "1 search/retrieval call(s).",
        "4 enrichment call(s)."
      ],
      "entityCount": 4
    },
    "requirements": {
      "requestedAttributes": [
        "location",
        "availability",
        "category"
      ],
      "comparisonIntent": false,
      "rankingIntent": false,
      "routeIntent": false,
      "listIntent": false,
      "explanationIntent": false,
      "matchedPhrases": [
        "near me",
        "where",
        "tonight",
        "style"
      ]
    },
    "metadata": {
      "toolSequence": [
        "PlaceSearch",
        "PlaceDetails",
        "PlaceDetails",
        "PlaceDetails",
        "PlaceDetails"
      ],
      "skills": [
        "default",
        "food"
      ],
      "latencyMs": 25026,
      "entityCount": 4,
      "supportingCount": 0,
      "filteredEvents": [
        {
          "eventId": "hs-1",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-2",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-3",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-4",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-5",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-6",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-7",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-8",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-9",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-10",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-12",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-13",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-14",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-15",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-16",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-17",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-18",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-19",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-21",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-23",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-25",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-27",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-28",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-29",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-30",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-31",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        },
        {
          "eventId": "hs-32",
          "type": "internal",
          "reason": "internal operation carries no consumer meaning."
        }
      ],
      "unrecognizedTools": [],
      "internalEventCount": 27,
      "invariantWarnings": [],
      "noRealTimingFound": false,
      "traceDurationMs": 22296,
      "captureId": "q10",
      "captureLabel": "Wensi Tofu"
    }
  }
];
