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
      console.log("Sondage récupéré :", this.poll);
      await this.renderPoll(this.poll);
    } catch (err) {
      console.error("Erreur chargement du sondage :", err.message);
    }
  }

  async renderPoll(poll) {
    const tile = document.getElementById("pollTile");
    tile.innerHTML = "";

    const alreadyVoted = localStorage.getItem(`voted_${poll.id}`);

    const questionEl = document.createElement("h3");
    questionEl.textContent = poll.question;
    tile.appendChild(questionEl);

    if (alreadyVoted) {
      const message = document.createElement("div");
      message.textContent = "Vous avez déjà voté. Voici les résultats :";
      message.style.marginBottom = "10px";
      tile.appendChild(message);

      await this.showResults(poll.id, tile);
      return;
    }

    const form = document.createElement("form");

    poll.options.forEach((option) => {
      const label = document.createElement("label");
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "pollOption";
      radio.value = option;
      label.appendChild(radio);
      label.appendChild(document.createTextNode(option));
      form.appendChild(label);
    });

    const voteBtn = document.createElement("button");
    voteBtn.type = "button";
    voteBtn.className = "vote-btn";
    voteBtn.textContent = "Voter";

    const message = document.createElement("div");
    message.className = "vote-message";

    voteBtn.addEventListener("click", async () => {
      const selected = form.querySelector('input[name="pollOption"]:checked');
      if (selected) {
        const ip = await this.getIP();
        const { error } = await supabase.from("votes").insert({
          poll_id: poll.id,
          option: selected.value,
          ip_address: ip,
        });

        if (error) {
          message.textContent = "Erreur lors du vote. Réessayez.";
          return;
        }

        localStorage.setItem(`voted_${poll.id}`, selected.value);

        message.textContent = `Merci pour votre vote : ${selected.value}`;
        voteBtn.disabled = true;
        form.querySelectorAll("input").forEach((i) => (i.disabled = true));
        form.remove();

        await this.showResults(poll.id, tile);
      } else {
        message.textContent = "Veuillez sélectionner une option.";
      }
    });

    form.appendChild(voteBtn);
    tile.appendChild(form);
    tile.appendChild(message);
  }

  // ✅ METHODE déplacée en dehors
  async showResults(pollId, container) {
    const { data: votes, error } = await supabase
      .from("votes")
      .select("option")
      .eq("poll_id", pollId);

    if (error) {
      console.error("Erreur chargement résultats :", error);
      return;
    }

    const results = {};
    votes.forEach((v) => {
      results[v.option] = (results[v.option] || 0) + 1;
    });

    const totalVotes = votes.length;
    const resultsEl = document.createElement("div");
    resultsEl.className = "poll-results";

    Object.entries(results).forEach(([option, count]) => {
      const percent = ((count / totalVotes) * 100).toFixed(1);
      const item = document.createElement("div");
      item.innerHTML = `<strong>${option}</strong> — ${count} vote(s) (${percent}%)`;
      resultsEl.appendChild(item);
    });

    container.appendChild(resultsEl);
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