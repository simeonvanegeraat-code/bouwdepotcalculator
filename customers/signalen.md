# Signalen

Wat echte bezoekers melden. Nieuwste bovenaan. Een signaal is pas afgehandeld
als er staat wat we ermee deden.

Vastleggen doe je zo: datum, wie (reis, bank, situatie), wat er gemeld werd,
wat we gecontroleerd hebben, en wat het opleverde. Nooit doorvertalen naar een
conclusie zonder de melding zelf te bewaren.

---

### 16-08-2026 - Rabobank, lopend depot, nieuwbouw

**Gemeld:** de vermelding "Max. per declaratie EUR 5.000" op de
vergelijkingspagina klopte niet met zijn praktijk.

**Gecontroleerd:** alle 37 datacellen nagelopen. Het bedrag stond correct in de
bron en in de JSON. Wat ontbrak was de toelichting "limiet zelf verhoogbaar",
die alleen op de detailpagina stond.

**Opgeleverd:** het patroon bleek zestien keer voor te komen, waaronder bij de
depotvergoeding van alle aanbieders, en een kop bij ABN AMRO was zelfs onjuist.
Structurele fix plus tests/nuance.test.mjs, die faalt zodra een waarde ergens
zonder zijn toelichting wordt getoond. Zie
[../context/beslissingen.md](../context/beslissingen.md).

**Wat dit signaal waard was:** een gebruiker vond in een minuut wat een
zelfcontrole niet had gevonden. Meldingen van mensen met een lopend depot zijn
de beste kwaliteitsbron die we hebben.

---

## Openstaande vragen aan bezoekers

Dingen die we graag zouden weten en nu invullen met aannames:

- Eigen arbeid: bij geen enkele aanbieder gepubliceerd. Wat gebeurt er in de
  praktijk als je die declareert?
- Hoe lang duurt uitbetaling werkelijk, per bank?
- Waar loopt een declaratie het vaakst op stuk?
