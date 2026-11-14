# Status | BOA Portaal

Openbare status voor [status.boaportaal.nl](https://status.boaportaal.nl).

De pagina haalt `/api/pulse` zelf op, elke 45 seconden. Die functie controleert het portaal, de servicedesk, het systeem, de mail en de aanmelddienst.

Onderhoud zet je in `staat.json`:

```json
{
  "melding": "Vanavond kort onderhoud aan de mail.",
  "onderhoud": [{ "dienst": "Mail", "tekst": "Postbus wordt bijgewerkt", "tot": "2026-11-20T22:00:00+01:00" }]
}
```

Publish directory is de root. Geen buildstap. Zet daarna het domein `status.boaportaal.nl` op de Netlify-site.
