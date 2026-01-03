async function loadMessages(){
  const token = document.getElementById("token").value.trim();
  const status = document.getElementById("status").value;
  const meta = document.getElementById("meta");
  meta.textContent = "Carregando...";

  const resp = await fetch(`/api/messages?status=${encodeURIComponent(status)}`, {
    headers: { "x-admin-token": token }
  });

  if(!resp.ok){
    meta.textContent = `Erro ${resp.status}. Verifique ADMIN_TOKEN.`;
    return;
  }

  const { messages } = await resp.json();
  meta.textContent = `Mostrando ${messages.length} mensagens.`;
  render(messages);
}

function render(messages){
  const tbody = document.getElementById("tbody");
  tbody.innerHTML = "";

  for(const m of messages){
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="small">${m.created_at || ""}</td>
      <td class="small">${escapeHtml(m.user_id || "")}</td>
      <td>${badge(m.direction || "")}</td>
      <td>
        ${escapeHtml(m.text||"")}
        <div class="small">${m.ai_response ? ("<b>AI:</b> " + escapeHtml(m.ai_response)) : ""}</div>
      </td>
      <td>${badge(m.intent || "—")}</td>
      <td>${badge(m.status || "")}</td>
      <td>
        <button onclick="setStatus('${m.id}','processed')">processed</button>
        <button onclick="setStatus('${m.id}','forwarded')">forwarded</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

async function setStatus(id,status){
  const token = document.getElementById("token").value.trim();
  await fetch(`/api/messages/${id}/status`,{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-admin-token": token
    },
    body: JSON.stringify({status})
  });
  loadMessages();
}

function badge(t){
  return `<span class="badge">${escapeHtml(String(t))}</span>`;
}

function escapeHtml(s){
  return (s||"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}
