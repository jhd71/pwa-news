// donation.js

// Crée le popup au chargement
window.addEventListener('load', () => {
    setTimeout(() => {
        const popup = document.createElement('div');
        popup.className = 'don-popup';
        popup.id = 'donPopup';
        popup.innerHTML = `
            <div class="don-popup-content">
                <button class="don-close" onclick="document.getElementById('donPopup').remove()">✖</button>
                <h3>🙏 Soutenez Actu & Média</h3>
                <p>Ce site est 100% gratuit, sans pub et réalisé bénévolement depuis plusieurs mois.</p>
                <p>Un petit don aide à payer l’hébergement et à continuer à développer de nouvelles idées !</p>
                <a href="https://www.paypal.com/donate?token=FDmY_KTRuIqrsjQi9vTizlK0_ijG1BU2k52p08MEkTvY-vn5qqyXVfnO4GNsAwDreBA-lOG8IP4ZGV9s"
                   class="don-button" target="_blank">💙 Faire un don via PayPal</a>
            </div>
        `;
        document.body.appendChild(popup);
    }, 30000); // s'affiche après 30 sec
});

// Injecte le CSS
const style = document.createElement('style');
style.textContent = `
.don-popup {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: #fff;
  color: #000;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 0 20px rgba(0,0,0,0.2);
  z-index: 10000;
  width: 300px;
  max-width: 90vw;
}
.don-popup-content {
  font-size: 15px;
}
.don-close {
  position: absolute;
  top: 6px;
  right: 10px;
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
}
.don-button {
  display: inline-block;
  margin-top: 15px;
  background: #0070ba;
  color: #fff;
  padding: 10px 20px;
  border-radius: 6px;
  text-decoration: none;
}
.don-button:hover {
  background: #005c9a;
}
`;
document.head.appendChild(style);
