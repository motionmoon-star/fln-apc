import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Increase payload limit for scanned documents and camera photos (base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy getter for Google GenAI client to handle optional or missing key gracefully
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Document OCR & Data Extraction Endpoint
app.post("/api/extract-document", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg", documentHint, textContent } = req.body;

    if (!imageBase64 && !textContent) {
      return res.status(400).json({
        success: false,
        error: "Aucun document (image, PDF ou texte) fourni pour l'analyse",
      });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: "Clé GEMINI_API_KEY non configurée sur le serveur.",
      });
    }

    const systemInstruction = `Tu es un expert assermenté en vérification administrative et transcription de documents d'identité et dossiers électoraux pour la République Algérienne Démocratique et Populaire (Kasma FLN Bologhine, Mouhafadha de Bab El Oued).
Tu analyses des photos prises par smartphone, scans, documents Word ou formulaires officiels :
- Carte Nationale d'Identité Biométrique (CNI / بطاقة التعريف الوطنية البيومترية)
- Extrait / Acte de naissance N° 12-kh (عقد الميلاد)
- Certificat de nationalité algérienne (شهادة الجنسية الجزائرية)
- Casier judiciaire Bulletin N° 3 (صحيفة السوابق القضائية)
- Diplôme d'études supérieures ou attestation universitaire (الشهادة الجامعية)
- Attestation de situation vis-à-vis du Service National (بطاقة الخدمة الوطنية / إعفاء / تأجيل)
- Carte d'adhérent / militant FLN (بطاقة مناضل حزب جبهة التحرير الوطني)
- Certificat de résidence ou attestation de régularité fiscale (شهادة الإقامة / الوضعية الجبائية)

Tâche :
1. Détecte le type précis de document.
2. Extrais fidèlement toutes les données textuelles lisibles en français et en arabe.
3. Pour les dates, normalise toujours au format YYYY-MM-DD.
4. Pour le NIN (Numéro d'Identification National), cherche le numéro à 18 chiffres sur la CNI algérienne.
5. Extrais le nom de famille (en majuscules en français et en arabe) et les prénoms (français et arabe).
6. Identifie le niveau d'instruction et la profession mentionnée si applicable.
7. Si une information n'est pas lisible ou absente du document, laisse la chaîne vide "" ou null. Ne fabrique pas de fausse information.`;

    const promptText = `Analyse ce document officiel algérien.${
      documentHint ? ` Indice sur le document attendu : ${documentHint}.` : ""
    } Extrais les informations nécessaires pour constituer la fiche du candidat et renseigner les champs administratifs.`;

    const contentsPayload: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
      // If PDF or image, use inlineData
      const effectiveMime = mimeType === 'application/pdf' ? 'application/pdf' : (mimeType.startsWith('image/') ? mimeType : 'image/jpeg');
      contentsPayload.push({
        inlineData: {
          mimeType: effectiveMime,
          data: cleanBase64,
        },
      });
    }
    if (textContent) {
      contentsPayload.push({
        text: `Contenu textuel extrait du document (Word/texte) :\n${textContent}`,
      });
    }
    contentsPayload.push({
      text: promptText,
    });

    let responseText = "{}";
    const modelsToTry = ["gemini-3.8-flash", "gemini-flash-latest"];
    let lastError: any = null;

    for (const modelCandidate of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: modelCandidate,
          contents: contentsPayload,
          config: {
            systemInstruction,
            temperature: 0.1, // Basse température pour une extraction factuelle rigoureuse
            responseMimeType: "application/json",
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                documentTypeDetected: {
                  type: Type.STRING,
                  description: "Type de document identifié (ex: CNI, Acte de Naissance, Diplôme Universitaire, Casier Judiciaire, Service National, etc.)",
                },
                lastNameFr: {
                  type: Type.STRING,
                  description: "Nom de famille en français (ex: BENALI)",
                },
                firstNameFr: {
                  type: Type.STRING,
                  description: "Prénom en français (ex: Mohamed)",
                },
                lastNameAr: {
                  type: Type.STRING,
                  description: "Nom de famille en arabe (ex: بن علي)",
                },
                firstNameAr: {
                  type: Type.STRING,
                  description: "Prénom en arabe (ex: محمد)",
                },
                gender: {
                  type: Type.STRING,
                  description: "'H' pour Homme (Masculin / ذكر) ou 'F' pour Femme (Féminin / أنثى)",
                },
                birthDate: {
                  type: Type.STRING,
                  description: "Date de naissance au format YYYY-MM-DD",
                },
                birthPlace: {
                  type: Type.STRING,
                  description: "Lieu de naissance (ex: Bologhine, Alger, Bab El Oued)",
                },
                nationalIdNumber: {
                  type: Type.STRING,
                  description: "Numéro d'Identification National (NIN à 18 chiffres) ou numéro de carte",
                },
                addressNeighborhood: {
                  type: Type.STRING,
                  description: "Quartier ou adresse de résidence si mentionnée (ex: Notre Dame d'Afrique, Bologhine)",
                },
                phoneNumber: {
                  type: Type.STRING,
                  description: "Numéro de téléphone du candidat si présent (ex: 0550123456)",
                },
                email: {
                  type: Type.STRING,
                  description: "Adresse email du candidat si mentionnée",
                },
                profession: {
                  type: Type.STRING,
                  description: "Profession ou fonction mentionnée sur le document",
                },
                educationLevel: {
                  type: Type.STRING,
                  description: "Niveau d'instruction (Doctorat, Master/Ingénieur, Licence, Technicien, Secondaire)",
                },
                isUniversityGraduate: {
                  type: Type.BOOLEAN,
                  description: "Vrai si titulaire d'un diplôme d'études supérieures (Licence, Master, Ingénieur, Doctorat)",
                },
                council: {
                  type: Type.STRING,
                  description: "Conseil électoral si mentionné: 'APC' pour APC Bologhine ou 'APW' pour APW Alger",
                },
                partyMembershipNumber: {
                  type: Type.STRING,
                  description: "Numéro de carte de militant FLN si carte du parti ou mentionné",
                },
                partyJoinYear: {
                  type: Type.INTEGER,
                  description: "Année d'adhésion au FLN (ex: 2018)",
                },
                partyRole: {
                  type: Type.STRING,
                  description: "Rôle dans le parti ou kasma FLN",
                },
                militaryStatus: {
                  type: Type.STRING,
                  description: "Situation service national: 'accompli', 'dispense', 'exempte', 'sursis', 'non_concerne'",
                },
                confidenceNotes: {
                  type: Type.STRING,
                  description: "Remarque sur la clarté de la photo/scan et remarques d'authenticité",
                },
              },
              required: ["documentTypeDetected"],
            },
          },
        });

        responseText = response.text?.trim() || "{}";
        lastError = null;
        break; // Succès !
      } catch (err: any) {
        lastError = err;
        console.warn(`Tentative OCR échouée avec ${modelCandidate}:`, err?.message || err);
        // Si erreur 503 ou forte demande temporaire, attendre 1.2s avant d'essayer le modèle suivant
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    if (lastError && responseText === "{}") {
      throw lastError;
    }

    const parsedData = JSON.parse(responseText);

    return res.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("Erreur d'analyse OCR du document:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Erreur lors de l'extraction des données du document",
    });
  }
});

// Logo management endpoints
app.post("/api/save-logo", (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "Image manquante" });
    }
    const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, "");
    const buffer = Buffer.from(cleanBase64, "base64");
    const assetsDir = path.join(process.cwd(), "public", "assets");
    if (!fs.existsSync(assetsDir)) {
      fs.mkdirSync(assetsDir, { recursive: true });
    }
    const targetPath = path.join(assetsDir, "fln-bologhine-logo.png");
    fs.writeFileSync(targetPath, buffer);

    return res.json({ success: true, path: "/assets/fln-bologhine-logo.png" });
  } catch (error: any) {
    console.error("Erreur enregistrement logo:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/logo-status", (_req, res) => {
  const customLogoPath = path.join(process.cwd(), "public", "assets", "fln-bologhine-logo.png");
  const hasCustomLogo = fs.existsSync(customLogoPath);
  res.json({
    hasCustomPng: hasCustomLogo,
    pngUrl: hasCustomLogo ? "/assets/fln-bologhine-logo.png" : null,
    svgUrl: "/assets/fln-bologhine-logo.svg"
  });
});

// Vite middleware and static serving
async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Serveur Kasma FLN Bologhine démarré sur http://0.0.0.0:${PORT}`);
  });
}

start();
