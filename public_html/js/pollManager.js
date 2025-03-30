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
      this.renderPoll(this.poll);
    } catch (err) {
      console.error("Erreur chargement du sondage :", err.message);
    }
  }

  renderPoll(poll) {
  const tile = document.createElement('div');
  tile.className = 'tile poll-tile';

  const questionEl = document.createElement('h3');
  questionEl.textContent = poll.question;
  tile.appendChild(questionEl);

  const form = document.createElement('form');

  poll.options.forEach((option, index) => {
    const label = document.createElement('label');
    const radio = document.createElement('input');
    radio.type = 'radio';
    radio.name = 'pollOption';
    radio.value = option;

    label.appendChild(radio);
    label.appendChild(document.createTextNode(option));
    form.appendChild(label);
  });

  const voteBtn = document.createElement('button');
  voteBtn.type = 'button';
  voteBtn.className = 'vote-btn';
  voteBtn.textContent = 'Voter';

  const message = document.createElement('div');
  message.className = 'vote-message';

  voteBtn.addEventListener('click', () => {
    const selected = form.querySelector('input[name="pollOption"]:checked');
    if (selected) {
      message.textContent = `Merci pour votre vote : ${selected.value}`;
      voteBtn.disabled = true;
      form.querySelectorAll('input').forEach(input => input.disabled = true);
    } else {
      message.textContent = "Veuillez sélectionner une option.";
    }
  });

  form.appendChild(voteBtn);
  tile.appendChild(form);
  tile.appendChild(message);

  return tile;
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