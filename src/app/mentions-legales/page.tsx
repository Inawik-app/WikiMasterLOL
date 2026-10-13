import type { Metadata } from "next";
import { DeleteAccount } from "@/components/DeleteAccount";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata: Metadata = { title: "Mentions légales et confidentialité" };

// Set NEXT_PUBLIC_CONTACT_EMAIL in the environment: the address is not kept in the repository.
const contact = process.env.NEXT_PUBLIC_CONTACT_EMAIL;

export default function Legal() {
  const mail = contact ? <a href={`mailto:${contact}`}>{contact}</a> : "l'adresse de contact indiquée par la personne qui t'a invité";
  return (
    <main className="forge">
      <SiteHeader />
      <header className="masthead">
        <h1>Mentions légales</h1>
        <p className="masthead__lede">Qui tient ce site, ce qu&apos;il sait de toi, et comment tout effacer.</p>
      </header>

      <div className="legal">
        <section>
          <h2>Le site</h2>
          <p>
            WikiMaster LoL est un jeu de collection de cartes fait par un fan, gratuit, sans publicité et sans achat. Il
            est édité à titre personnel par un particulier, qui a communiqué son identité à l&apos;hébergeur comme le
            prévoit la loi. Contact : {mail}.
          </p>
          <p>Hébergeur : Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis (vercel.com).</p>
        </section>

        <section>
          <h2>Riot Games</h2>
          <p>
            WikiMaster LoL n&apos;est pas approuvé par Riot Games et ne reflète ni les opinions ni les points de vue de
            Riot Games ou de quiconque participant officiellement à la production ou à la gestion des propriétés de
            Riot Games. Riot Games et toutes les propriétés associées sont des marques commerciales ou des marques
            déposées de Riot Games, Inc.
          </p>
          <p>
            Les illustrations, noms et textes des cartes appartiennent à Riot Games. Les images sont affichées depuis
            les serveurs de Riot et de CommunityDragon, elles ne sont pas copiées ici.
          </p>
        </section>

        <section>
          <h2>Tes données</h2>
          <p>Le site ne garde que ce qu&apos;il faut pour jouer :</p>
          <ul>
            <li>ton identifiant, ton pseudo et ton avatar Discord, reçus quand tu te connectes ;</li>
            <li>ton adresse e-mail Discord, gardée par le service de connexion et jamais affichée ;</li>
            <li>ta collection de cartes, ta réserve de boosters, ton essence et ton sceau de forge ;</li>
            <li>ta liste d&apos;amis.</li>
          </ul>
          <p>
            Ton pseudo et ton avatar sont visibles des autres joueurs connectés, qui peuvent t&apos;ajouter en ami sans
            demande préalable. Tes amis voient ta collection. Quand tu es le premier à trouver une carte légendaire ou
            plus rare, ton pseudo est affiché à tous comme son découvreur.
          </p>
          <p>
            Ces données servent uniquement au jeu (base légale : l&apos;exécution du service que tu demandes en te
            connectant). Elles ne sont ni vendues ni utilisées pour de la publicité ou de la mesure d&apos;audience.
            Elles sont conservées tant que ton compte existe.
          </p>
          <p>
            Prestataires qui les traitent : Supabase (connexion et base de données), Vercel (hébergement du site) et
            Discord (connexion). Ces sociétés sont établies aux États-Unis ; des données peuvent donc y être
            transférées, dans le cadre des clauses contractuelles types de la Commission européenne.
          </p>
          <p>
            Un seul cookie est déposé : celui qui te garde connecté. Il est indispensable au fonctionnement, il n&apos;y
            a donc pas de bandeau de consentement. Aucun traceur.
          </p>
        </section>

        <section>
          <h2>Tes droits</h2>
          <p>
            Tu peux demander une copie de tes données, leur correction ou leur effacement en écrivant à {mail}. Si la
            réponse ne te convient pas, tu peux saisir la CNIL (cnil.fr).
          </p>
          <p>Tu peux aussi tout effacer toi-même, tout de suite :</p>
          <DeleteAccount />
        </section>

        <section>
          <h2>Règles du jeu</h2>
          <ul>
            <li>Un compte par personne. Pas de script ni de robot pour ouvrir des boosters.</li>
            <li>
              Ton pseudo Discord s&apos;affiche aux autres : pas de pseudo injurieux, haineux ou qui usurpe
              l&apos;identité de quelqu&apos;un. Pour en signaler un, écris à {mail}.
            </li>
            <li>Un compte qui ne respecte pas ces règles peut être supprimé.</li>
            <li>
              Le jeu est fourni tel quel, sans garantie. Les cartes n&apos;ont aucune valeur et la collection peut être
              remise à zéro ou le site fermé à tout moment.
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
