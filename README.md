# CoutureGest — SaaS Gestion Atelier de Couture

> Plateforme complète de gestion pour ateliers de confection textile

## Fonctionnalités

| Module | Description |
|--------|-------------|
| 📦 **Matières Premières** | Stock tissu, fil, boutons — mouvements entrées/sorties, alertes stock minimum |
| ✂️ **Modèles** | Nomenclature (BOM), gammes opératoires, temps standards par opération |
| 🏭 **Production** | Ordres de fabrication, suivi statut, encours (semi-finis) par poste |
| 🏬 **Stock Produits Finis** | Entrées/sorties, valorisation, traçabilité |
| 👥 **Employés** | Gestion multi-mode : pièce, chaîne, horaire, mensuel |
| 💰 **Paie** | Calcul automatique par pièce ou chaîne, bulletins de paie |
| 📊 **Coûts & Analyses** | Coût minute, coût moyen modèle, marges bénéficiaires |

## Formules Clés

### Coût Minute
```
Coût Minute = Σ Salaires Mensuels / (Nb Opérateurs × Jours/Mois × H/Jour × 60 × Efficacité%)
```

### Coût Moyen Modèle
```
Coût Matières = Σ (Quantité × Prix Unitaire)
Coût MO      = Σ (Temps Opération min × Coût Minute)
Coût Total   = (Coût Matières + Coût MO) × (1 + Overhead%)
```

### Paie par Pièce
```
Salaire = Σ (Quantité Produite × Tarif Pièce par Opération)
```

## Stack

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + React Query

## Installation

```bash
# Backend
cd backend && npm install
cp .env.example .env  # configurer DATABASE_URL
npm run db:push && npm run db:seed
npm run dev  # port 3001

# Frontend
cd frontend && npm install
npm run dev  # port 5173
```

**Login demo**: admin@couture.dz / admin123
