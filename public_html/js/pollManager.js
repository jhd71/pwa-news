// js/pollManager.js

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const supabaseUrl = "https://ekjgfiyhkythqcnmhzea.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVramdmaXloa3l0aHFjbm1oemVhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI2NzYxNDIsImV4cCI6MjA1ODI1MjE0Mn0.V0j_drb6GiTojgwxC6ydjnyJDRRT9lUbSc1E7bFE2Z4"; // ⚠️ Remplace par ta clé publique (pas la service_role !)
const supabase = createClient(supabaseUrl, supabaseKey);

export default class PollManager {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.poll = null;
  }

  async init() {
    try {
      const { data, error } = await supabase
        .from("polls")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;
      this.poll = data;
      this.renderPoll();
    } catch (err) {
      console.error("Erreur chargement du sondage :", err.message);
    }
  }

  renderPoll() {
    if (!this.poll || !this.container) return;

    this.container.innerHTML = `
      <div class="poll-tile">
        <h3>${this.poll.question}</h3>
        <form id="pollForm">
          ${this.poll.options
            .map(
              (option, index) => `
            <label>
              <input type="radio" name="option" value="${option}">
              ${option}
            </label>
          `
            )
            .join("")}
          <button type="submit">Voter</button>
        </form>
        <div id="pollMessage"></div>
      </div>
    `;

    document
      .getElementById("pollForm")
      .addEventListener("submit", (e) => this.handleVote(e));
  }

  async handleVote(event) {
    event.preventDefault();
    const form = event.target;
    const selectedOption = form.option.value;

    if (!selectedOption) {
      this.showMessage("Veuillez sélectionner une option.", "error");
      return;
    }

    const ip = await this.getIP();

    const { error } = await supabase.from("votes").insert({
      poll_id: this.poll.id,
      option: selectedOption,
      ip_address: ip,
    });

    if (error) {
      this.showMessage("Erreur lors du vote. Réessayez.", "error");
    } else {
      this.showMessage("Merci pour votre vote ! ✅", "success");
      form.remove();
    }
  }

  showMessage(text, type) {
    const msgDiv = document.getElementById("pollMessage");
    msgDiv.textContent = text;
    msgDiv.style.color = type === "success" ? "green" : "red";
  }

  async getIP() {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      return data.ip || "unknown";
    } catch {
      return "unknown";
    }
  }
}