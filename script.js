let map;
let directionsService;
let directionsRenderer;

function initMap() {
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: { lat: -14.235, lng: -51.925 },
    });

    directionsRenderer.setMap(map);

    const origemInput = document.getElementById("origem");
    const destinoInput = document.getElementById("destino");

    new google.maps.places.Autocomplete(origemInput);
    new google.maps.places.Autocomplete(destinoInput);
}

// Variáveis globais para guardar o último cálculo e enviar ao WhatsApp
let ultimaDistancia = "";
let ultimoTipoRota = "";
let ultimoValorFrete = "";

document.getElementById("calcularBtn").addEventListener("click", () => {
    const origem = document.getElementById("origem").value;
    const destino = document.getElementById("destino").value;
    const tipoCarga = document.getElementById("tipoCarga").value;

    if (!origem || !destino) {
        alert("Por favor, preencha os endereços de partida e chegada.");
        return;
    }

    const request = {
        origin: origem,
        destination: destino,
        travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.route(request, (result, status) => {
        if (status === "OK") {
            directionsRenderer.setDirections(result);

            const distanciaMetros = result.routes[0].legs[0].distance.value;
            const distanciaKm = distanciaMetros / 1000;
            ultimaDistancia = result.routes[0].legs[0].distance.text;

            // Regra de preço: Até 30 km = R$ 15,00/km (Urbano) | Acima de 30 km = R$ 7,00/km (Viagem)
            let valorPorKm = distanciaKm <= 30 ? 15.00 : 7.00;
            ultimoTipoRota = distanciaKm <= 30 ? "Urbano (Dentro da cidade)" : "Intermunicipal / Viagem";

            // Fator multiplicador de acordo com o tipo de carga
            let multiplicadorCarga = 1.0;
            if (tipoCarga.includes("Pequena")) multiplicadorCarga = 0.8;
            if (tipoCarga.includes("Grande")) multiplicadorCarga = 1.3;

            let valorTotal = (distanciaKm * valorPorKm) * multiplicadorCarga;
            if (valorTotal < 30.00) valorTotal = 30.00;

            ultimoValorFrete = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            // Exibe na tela
            document.getElementById("distancia").innerText = ultimaDistancia;
            document.getElementById("tipoRota").innerText = ultimoTipoRota;
            document.getElementById("valorFrete").innerText = ultimoValorFrete;
            document.getElementById("resultado").classList.remove("hidden");
        } else {
            alert("Não foi possível calcular a rota. Verifique os endereços informados.");
        }
    });
});

// Ação do botão de WhatsApp
document.getElementById("whatsappBtn").addEventListener("click", () => {
    const origem = document.getElementById("origem").value;
    const destino = document.getElementById("destino").value;
    const tipoCarga = document.getElementById("tipoCarga").value;
    const dataFrete = document.getElementById("dataFrete").value || "Não informada";
    const horaFrete = document.getElementById("horaFrete").value || "Não informado";

    // Formata a data para DD/MM/AAAA se preenchida
    let dataFormatada = dataFrete;
    if (dataFrete !== "Not specified" && dataFrete.includes("-")) {
        const partes = dataFrete.split("-");
        dataFormatada = `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    const mensagem = 
        `🚚 *SOLICITAÇÃO DE ORÇAMENTO - FRETEFÁCIL* 🚚\n\n` +
        `📍 *Origem:* ${origem}\n` +
        `🎯 *Destino:* ${destino}\n` +
        `📦 *Carga:* ${tipoCarga}\n` +
        `📅 *Data Desejada:* ${dataFormatada}\n` +
        `⏰ *Horário:* ${horaFrete}\n` +
        `📏 *Distância:* ${ultimaDistancia}\n` +
        `💰 *Valor Estimado:* ${ultimoValorFrete}\n\n` +
        `Gostaria de confirmar este frete!`;

    const telefone = "5588993082035";
    const urlWhatsapp = `https://api.whatsapp.com/send?phone=${telefone}&text=${encodeURIComponent(mensagem)}`;
    
    window.open(urlWhatsapp, '_blank');
});

window.onload = initMap;
