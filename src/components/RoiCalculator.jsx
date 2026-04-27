import React, { useState } from 'react';
import './RoiCalculator.css';

const RoiCalculator = () => {
  const [leads, setLeads] = useState(100);
  const [ticket, setTicket] = useState(500);
  const [conversion, setConversion] = useState(10);

  const recoveredRevenue = leads * (conversion / 100) * ticket;
  const timeSaved = leads * 5; // 5 minutes per lead

  return (
    <section className="roi-calculator section" id="calculadora">
      <div className="container">
        <div className="roi-header">
          <span className="section-label">💰 CALCULADORA DE IMPACTO</span>
          <h2 className="section-title text-center">
            Quanto a ZettaBots vai <br />
            <span className="gradient-text">gerar para o seu negócio?</span>
          </h2>
        </div>

        <div className="roi-grid">
          <div className="roi-inputs glass-card">
            <h3 className="card-title">Simule seus resultados</h3>
            
            <div className="input-group">
              <label>Leads Mensais no WhatsApp</label>
              <input 
                type="range" 
                min="10" 
                max="5000" 
                value={leads} 
                onChange={(e) => setLeads(parseInt(e.target.value))} 
              />
              <div className="input-value">{leads} leads</div>
            </div>

            <div className="input-group">
              <label>Ticket Médio (R$)</label>
              <input 
                type="number" 
                value={ticket} 
                onChange={(e) => setTicket(parseInt(e.target.value))} 
              />
            </div>

            <div className="input-group">
              <label>Taxa de Conversão Atual (%)</label>
              <input 
                type="range" 
                min="1" 
                max="50" 
                value={conversion} 
                onChange={(e) => setConversion(parseInt(e.target.value))} 
              />
              <div className="input-value">{conversion}%</div>
            </div>
          </div>

          <div className="roi-results">
            <div className="result-card gradient-purple">
              <div className="result-label">Recuperação de Vendas Estimada</div>
              <div className="result-value">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(recoveredRevenue)}
              </div>
              <div className="result-sub">Mensais em Pipeline</div>
            </div>

            <div className="result-card gradient-blue">
              <div className="result-label">Tempo de Atendimento Poupado</div>
              <div className="result-value">
                {Math.floor(timeSaved / 60)}h {timeSaved % 60}m
              </div>
              <div className="result-sub">Foque no que realmente importa</div>
            </div>

            <div className="roi-cta">
              <p>Pare de perder dinheiro por demora no atendimento.</p>
              <button className="btn-primary" onClick={() => window.location.href = '#contato'}>
                Quero recuperar minhas vendas 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RoiCalculator;
