import {
  cardStyle,
  copyButtonStyle,
  legalTextStyle,
  sectionTitleStyle,
} from "@/lib/gold/styles";
import type { LegalTab } from "@/lib/gold/types";

export default function LegalSection({
  legalTab,
  emailDisplay,
  copyEmail,
}: {
  legalTab: LegalTab;
  emailDisplay: string;
  copyEmail: () => void;
}) {
  if (legalTab === "none") return null;

  if (legalTab === "impressum") {
    return (
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Impressum</h2>

        <div style={legalTextStyle}>
          <p>
            <strong>Angaben gemäß § 5 ECG</strong>
          </p>

          <p>
            Ali Osman Nikbay
            <br />
            Arbeiterstraße 12
            <br />
            3943 Schrems
            <br />
            Österreich
          </p>

          <p>
            E-Mail: {emailDisplay}
            <br />
            <button type="button" onClick={copyEmail} style={copyButtonStyle}>
              E-Mail kopieren
            </button>
          </p>

          <p>
            <strong>Haftungsausschluss:</strong>
            <br />
            Die auf dieser Website dargestellten Preise, Prozentänderungen und Marktwerte
            werden automatisiert aus externen Datenquellen und eigenen Berechnungen abgeleitet.
            Trotz sorgfältiger Erstellung übernehmen wir keine Gewähr für Richtigkeit,
            Vollständigkeit, Aktualität oder jederzeitige Verfügbarkeit der Inhalte.
            <br />
            Sämtliche Angaben sind unverbindlich und dienen ausschließlich der allgemeinen
            Information. Eine Haftung für Schäden oder Nachteile, die aus der Nutzung der auf
            dieser Website bereitgestellten Informationen entstehen, ist – soweit gesetzlich
            zulässig – ausgeschlossen.
          </p>

          <p>
            <strong>Keine Anlageberatung:</strong>
            <br />
            Die Inhalte dieser Website stellen weder eine Anlageberatung noch eine Kauf-,
            Verkaufs- oder Investitionsempfehlung dar. Die bereitgestellten Informationen
            ersetzen keine individuelle Beratung.
          </p>

          <p>
            <strong>Zeitstempel-Hinweis:</strong>
            <br />
            Maßgeblich ist immer der zum jeweiligen Zeitpunkt auf der Website angezeigte Stand.
            Kurzfristige Abweichungen zu externen Anbietern sind aufgrund von Zeitverzögerungen,
            Aufschlägen, Spreads und Rundungen möglich.
          </p>

          <p>
            <strong>Zu den Preisangaben:</strong>
            <br />
            Referenzpreise basieren auf internationalen Spotpreisen und Wechselkursen.
            Marktpreise sind angenäherte Richtwerte und können von tatsächlichen Händlerpreisen,
            Ankauf-/Verkaufspreisen sowie Produktpreisen einzelner Anbieter abweichen.
            Preise externer Anbieter können eigene Aufschläge, Spreads, Gebühren oder
            produktbezogene Zuschläge enthalten.
            <br />
            <br />
            Diese Website übernimmt keine Inhalte, Texte oder Preisangaben einzelner Websites
            direkt. Die angezeigten Werte werden aus externen Marktdaten sowie eigenen
            Berechnungen abgeleitet.
          </p>

          <p>
            <strong>Keine Verbindlichkeit:</strong>
            <br />
            Es kommt kein Vertragsverhältnis allein durch die Nutzung dieser Website zustande.
          </p>

          <p>
            <strong>Hinweis zum Datenschutz und zur Kontaktaufnahme:</strong>
            <br />
            Die im Impressum veröffentlichten Kontaktdaten dienen ausschließlich der gesetzlich
            vorgeschriebenen Anbieterkennzeichnung und der zulässigen Kontaktaufnahme. Einer
            missbräuchlichen Verwendung, insbesondere zur Übersendung von Werbung, Spam,
            Massenanfragen oder zur sonstigen unbefugten Weiterverarbeitung, wird ausdrücklich
            widersprochen.
          </p>
        </div>
      </section>
    );
  }

  if (legalTab === "disclaimer") {
    return (
      <section style={cardStyle}>
        <h2 style={sectionTitleStyle}>Disclaimer & Datenschutz</h2>

        <div style={legalTextStyle}>
          <p>
            <strong>Disclaimer</strong>
          </p>

          <p>
            Die auf dieser Website veröffentlichten Inhalte dienen ausschließlich der allgemeinen
            Information.
          </p>

          <p>
            Die dargestellten Referenzpreise und Marktpreise werden automatisiert aus externen
            Datenquellen sowie eigenen Berechnungen abgeleitet. Trotz sorgfältiger Erstellung und
            laufender Aktualisierung übernehmen wir keine Gewähr für Richtigkeit, Vollständigkeit,
            Aktualität und Verfügbarkeit der Inhalte.
          </p>

          <p>
            Sämtliche Preisangaben sind unverbindliche Richtwerte. Abweichungen zu tatsächlichen
            Händler-, Ankauf-, Verkauf- oder Produktpreisen sind jederzeit möglich.
          </p>

          <p>
            Die Inhalte dieser Website stellen keine Anlageberatung, Rechtsberatung,
            Finanzberatung oder Kaufempfehlung dar.
          </p>

          <p>
            Eine Haftung für Schäden oder sonstige Nachteile, die direkt oder indirekt aus der
            Nutzung der auf dieser Website bereitgestellten Informationen entstehen, ist – soweit
            gesetzlich zulässig – ausgeschlossen.
          </p>

          <p>
            Zusätzlich gilt: Es werden keine Inhalte, Texte oder Preisangaben bestimmter Websites
            direkt übernommen. Die angezeigten Werte basieren auf externen Marktdaten,
            Wechselkursdaten sowie eigenen Berechnungsmodellen und Annäherungen.
          </p>

          <p>
            <strong>Datenschutz</strong>
          </p>

          <p>
            Diese Website verarbeitet personenbezogene Daten nur in jenem Umfang, der für den
            technischen Betrieb, die Bereitstellung der Website sowie zur Reichweitenmessung und
            Verbesserung des Angebots erforderlich ist.
          </p>

          <p>
            <strong>Hosting:</strong>
            <br />
            Diese Website wird über Vercel bereitgestellt. Dabei können technische Zugriffsdaten
            wie IP-Adresse, Zeitpunkt des Aufrufs, Browser-Informationen, Gerätedaten und
            aufgerufene Seiten verarbeitet werden, soweit dies zur sicheren und stabilen
            Bereitstellung der Website erforderlich ist.
          </p>

          <p>
            <strong>Analytics:</strong>
            <br />
            Diese Website verwendet Vercel Analytics zur anonymisierten bzw. aggregierten
            Auswertung der Nutzung.
          </p>

          <p>
            <strong>Cookies und Tracking:</strong>
            <br />
            Nach aktuellem technischem Stand verwendet die eingesetzte Analytics-Lösung keine
            Third-Party-Cookies. Es kann dennoch nicht ausgeschlossen werden, dass technische
            Verbindungs- und Nutzungsdaten durch den Hosting- oder Analytics-Anbieter im
            erforderlichen Umfang verarbeitet werden.
          </p>

          <p>
            <strong>Rechtsgrundlage:</strong>
            <br />
            Die Verarbeitung erfolgt auf Grundlage unseres berechtigten Interesses an der
            sicheren Bereitstellung der Website, an der technischen Fehlerbehebung sowie an der
            anonymisierten statistischen Auswertung und Verbesserung unseres Online-Angebots.
          </p>

          <p>
            <strong>Speicherdauer:</strong>
            <br />
            Personenbezogene Daten werden nur so lange gespeichert, wie dies für die genannten
            Zwecke erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.
          </p>

          <p>
            <strong>Ihre Rechte:</strong>
            <br />
            Sie haben im Rahmen der gesetzlichen Bestimmungen das Recht auf Auskunft,
            Berichtigung, Löschung, Einschränkung der Verarbeitung, Widerspruch sowie
            gegebenenfalls Datenübertragbarkeit. Wenn Sie der Ansicht sind, dass die Verarbeitung
            Ihrer Daten gegen Datenschutzrecht verstößt, können Sie sich an die zuständige
            Datenschutzbehörde wenden.
          </p>

          <p>
            <strong>Kontakt:</strong>
            <br />
            Für Anfragen zum Datenschutz oder zu den auf dieser Website verarbeiteten Daten
            können Sie die oben angegebene E-Mail-Adresse verwenden.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section style={cardStyle}>
      <h2 style={sectionTitleStyle}>Wie werden Marktpreise berechnet?</h2>

      <div style={legalTextStyle}>
        <p>
          Ausgangspunkt ist der internationale Spotpreis für Gold sowie aktuelle EUR/USD- und
          EUR/TRY-Wechselkurse.
        </p>

        <p>
          Für Referenzpreise werden Goldreinheit, Feingoldgewicht und Wechselkurs direkt auf
          das jeweilige Produkt angewendet.
        </p>

        <p>
          Für Marktpreise werden anschließend modellierte produktbezogene Aufschläge verwendet.
          Diese Marktpreise sind daher Richtwerte und keine direkt übernommenen Händlerpreise.
        </p>
      </div>
    </section>
  );
}