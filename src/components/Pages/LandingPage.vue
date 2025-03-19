<template>
  <div class="landing-page">
    <header class="hero-section">
      <div class="hero-content">
        <h1>Bienvenue sur Open Course Factory</h1>
        <p>Transformez votre enseignement avec des cours interactifs et des labs intégrés.</p>
        <div class="cta-buttons">
          <router-link to="/login" class="btn btn-primary btn-lg">Se connecter</router-link>
          <router-link to="/register" class="btn btn-outline-light btn-lg">S'enregistrer</router-link>
        </div>
      </div>
    </header>
    <main>
      <section class="features">
        <div class="feature">
          <h2>Pourquoi choisir Open Course Factory ?</h2>
          <p>Découvrez comment notre plateforme peut révolutionner votre manière d'enseigner et d'apprendre.</p>
        </div>
        <div class="feature">
          <h2>Fonctionnalités Principales</h2>
          <ul>
            <li>Création de cours avec des labs intégrés</li>
            <li>Gestion des utilisateurs et des rôles</li>
            <li>Planification et suivi des cours</li>
            <li>Interface intuitive et conviviale</li>
          </ul>
        </div>
      </section>
      <section class="testimonials">
        <h2>Ce que disent nos utilisateurs</h2>
        <p>"Open Course Factory a transformé notre façon d'enseigner. Les étudiants sont plus engagés que jamais !" - Professeur X</p>
      </section>
    </main>
    <footer class="footer-section">
      <p>&copy; 2023-2025 Solution Libre. Tous droits réservés.</p>
    </footer>
  </div>
</template>

<style scoped>
.landing-page {
  font-family: 'Arial', sans-serif;
  color: #333;
}

.hero-section {
  background: linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('path-to-your-image.jpg') no-repeat center center/cover;
  color: #fff;
  text-align: center;
  padding: 100px 20px;
}

.hero-content h1 {
  font-size: 3rem;
  margin-bottom: 20px;
}

.hero-content p {
  font-size: 1.5rem;
  margin-bottom: 30px;
}

.cta-buttons .btn {
  margin: 10px;
}

.features {
  display: flex;
  justify-content: space-around;
  padding: 60px 20px;
  background-color: #f8f9fa;
}

.feature {
  max-width: 45%;
}

.testimonials {
  text-align: center;
  padding: 60px 20px;
  background-color: #e9ecef;
}

.footer-section {
  background-color: #343a40;
  color: #fff;
  text-align: center;
  padding: 20px;
  position: relative;
  bottom: 0;
  width: 100%;
}
</style>
