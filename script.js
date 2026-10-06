let map;
let directionsService;
let directionsRenderer;

function initMap() {
    // Inicializa o mapa centralizado no Brasil
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer();

    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 7,
        center: { lat: -14.235, lng: -51.925 }, // Centro aproximado do Brasil
    });

    directionsRenderer.setMap(map);

    // Ativa o Autocomplete do Google Maps para os inputs de endereço
    const origemInput = document.getElementById("origem");
    const destinoInput = document.getElementById("destino");

    new google.maps.places.Autocomplete(origemInput);
    new google.maps.places.Autocomplete(destinoInput);
}

document.getElementById("calcularBtn").addEventListener("click", () => {
    const origem = document.getElementById("origem").value;
    const destino = document.getElementById("destino").value;

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

            // Pega a distância em metros e converte para quilômetros
            const distanciaMetros = result.routes[0].legs[0].distance.value;
            const distanciaKm = distanciaMetros / 1000;
            const distanciaTexto = result.routes[0].legs[0].distance.text;

            // Defina aqui o preço do frete por quilômetro (ex: R$ 4,50 por km)
            const valorPorKm = 4.50; 
            const taxaFixa = 15.00; // Taxa base opcional
            const valorTotal = (distanciaKm * valorPorKm) + taxaFixa;

            // Exibe os resultados
            document.getElementById("distancia").innerText = distanciaTexto;
            document.getElementById("valorFrete").innerText = valorTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            document.getElementById("resultado").classList.remove("hidden");
        } else {
            alert("Não foi possível calcular a rota. Verifique os endereços informados.");
        }
    });
});

// Inicializa o mapa assim que a página carregar
window.onload = initMap;
