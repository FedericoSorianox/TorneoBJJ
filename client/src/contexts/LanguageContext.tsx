import React, { createContext, useState, useContext, ReactNode } from 'react';

type Language = 'en' | 'es';

interface LanguageContextType {
    language: Language;
    toggleLanguage: () => void;
    t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
    en: {
        'app.title': 'BJJ Manager',
        'nav.tournaments': 'Tournaments',
        'nav.athletes': 'Athletes',
        'nav.rankings': 'Rankings',

        'common.loading': 'Loading...',
        'common.back': 'Back',
        'common.backHome': 'Back Home',
        'common.save': 'Save',
        'common.cancel': 'Cancel',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.create': 'Create',
        'common.confirm': 'Confirm',
        'common.error': 'An error occurred',

        'tournaments.title': 'Tournaments',
        'tournaments.new': '+ New Tournament',
        'tournaments.deleteConfirm': 'Are you sure you want to delete this tournament?',
        'tournaments.status': 'Status',

        'tournament.create.title': 'New Tournament',
        'tournament.create.subtitle': 'Fill in the details to start your competition',
        'tournament.edit.title': 'Edit Tournament',
        'tournament.edit.subtitle': 'Update tournament settings and information',
        'tournament.form.name': 'Tournament Name',
        'tournament.form.date': 'Date',
        'tournament.form.location': 'Location',
        'tournament.form.system': 'Elimination System',
        'tournament.form.status': 'Status',
        'tournament.form.createBtn': 'Create Tournament',
        'tournament.form.saveBtn': 'Save Changes',
        'tournament.form.placeholder.name': 'e.g. Summer Open 2024',
        'tournament.form.placeholder.location': 'e.g. Madison Square Garden, NY',

        'detail.title': 'Tournament Details',
        'detail.edit': 'Edit Tournament',
        'detail.addCategory': '+ Add Category',
        'detail.athletes': 'Athletes',
        'detail.generateBracket': 'Generate Bracket',
        'detail.viewBracket': 'View Bracket',
        'detail.deleteCategoryConfirm': 'Delete this category?',
        'detail.generateConfirm': 'Generate bracket? This will reset existing matches.',
        'detail.generated': 'Bracket Generated!',

        'category.form.name': 'Name',
        'category.form.weightClass': 'Weight Class',
        'category.form.create': 'Create',
        'category.form.addAthlete': 'Add Athlete...',

        'athletes.title': 'Athletes',
        'athletes.new': 'New Athlete',
        'athletes.edit': 'Edit Athlete',
        'athletes.form.name': 'Name',
        'athletes.form.academy': 'Academy',
        'athletes.form.belt': 'Belt',
        'athletes.form.gender': 'Gender',
        'athletes.form.weight': 'Weight (kg)',
        'athletes.form.age': 'Age',
        'athletes.form.addBtn': 'Add Athlete',
        'athletes.form.updateBtn': 'Update Athlete',
        'athletes.deleteConfirm': 'Are you sure you want to delete this athlete?',
        'athletes.noAthletes': 'No athletes found.',

        'scoreboard.loading': 'LOADING SCOREBOARD...',
        'scoreboard.endMatch': 'End Match',
        'scoreboard.back': 'Back',
        'modal.finalize': 'Finalize Match Result',
        'modal.selectWinner': 'Select Winner',
        'modal.method': 'Victory Method',
        'modal.cancel': 'Cancel',
        'modal.confirm': 'Confirm Result',
        'modal.points': 'Points',
        'modal.submission': 'Submission',
        'modal.decision': 'Referee Decision',
        'modal.dq': 'Disqualification',
        'modal.walkover': 'Walkover',
        'modal.advantage': 'Advantage',

        'brackets.title': 'BRACKETS',
        'brackets.loading': 'Loading Bracket...',
        'brackets.notFound': 'No Bracket Found',
        'brackets.notFoundDesc': 'We couldn\'t find a bracket for this category. It might not have been generated yet.',
        'brackets.goBack': 'Go Back',
        'brackets.main': 'MAIN BRACKET',
        'brackets.consolation': 'CONSOLATION BRACKET',
        'brackets.round': 'Round',

        'leaderboard.title': 'Leaderboard',
        'leaderboard.loading': 'Loading Leaderboard...',
        'leaderboard.athlete': 'Athlete',
        'leaderboard.academy': 'Academy',
        'leaderboard.wins': 'Wins',
        'leaderboard.subs': 'Subs',
        'leaderboard.points': 'Points',
        'leaderboard.belt': 'Belt',
    },
    es: {
        'app.title': 'Gestor BJJ',
        'nav.tournaments': 'Torneos',
        'nav.athletes': 'Atletas',
        'nav.rankings': 'Rankings',

        'common.loading': 'Cargando...',
        'common.back': 'Volver',
        'common.backHome': 'Volver al Inicio',
        'common.save': 'Guardar',
        'common.cancel': 'Cancelar',
        'common.delete': 'Eliminar',
        'common.edit': 'Editar',
        'common.create': 'Crear',
        'common.confirm': 'Confirmar',
        'common.error': 'Ocurrió un error',

        'tournaments.title': 'Torneos',
        'tournaments.new': '+ Nuevo Torneo',
        'tournaments.deleteConfirm': '¿Estás seguro de que deseas eliminar este torneo?',
        'tournaments.status': 'Estado',

        'tournament.create.title': 'Nuevo Torneo',
        'tournament.create.subtitle': 'Completa los detalles para comenzar tu competencia',
        'tournament.edit.title': 'Editar Torneo',
        'tournament.edit.subtitle': 'Actualiza la configuración e información del torneo',
        'tournament.form.name': 'Nombre del Torneo',
        'tournament.form.date': 'Fecha',
        'tournament.form.location': 'Ubicación',
        'tournament.form.system': 'Sistema de Eliminación',
        'tournament.form.status': 'Estado',
        'tournament.form.createBtn': 'Crear Torneo',
        'tournament.form.saveBtn': 'Guardar Cambios',
        'tournament.form.placeholder.name': 'ej. Abierto de Verano 2024',
        'tournament.form.placeholder.location': 'ej. Madison Square Garden, NY',

        'detail.title': 'Detalles del Torneo',
        'detail.edit': 'Editar Torneo',
        'detail.addCategory': '+ Agregar Categoría',
        'detail.athletes': 'Atletas',
        'detail.generateBracket': 'Generar Llave',
        'detail.viewBracket': 'Ver Llave',
        'detail.deleteCategoryConfirm': '¿Eliminar esta categoría?',
        'detail.generateConfirm': '¿Generar llave? Esto reiniciará las luchas existentes.',
        'detail.generated': '¡Llave Generada!',

        'category.form.name': 'Nombre',
        'category.form.weightClass': 'Clase de Peso',
        'category.form.create': 'Crear',
        'category.form.addAthlete': 'Agregar Atleta...',

        'athletes.title': 'Atletas',
        'athletes.new': 'Nuevo Atleta',
        'athletes.edit': 'Editar Atleta',
        'athletes.form.name': 'Nombre',
        'athletes.form.academy': 'Academia',
        'athletes.form.belt': 'Cinturón',
        'athletes.form.gender': 'Género',
        'athletes.form.weight': 'Peso (kg)',
        'athletes.form.age': 'Edad',
        'athletes.form.addBtn': 'Agregar Atleta',
        'athletes.form.updateBtn': 'Actualizar Atleta',
        'athletes.deleteConfirm': '¿Estás seguro de que deseas eliminar este atleta?',
        'athletes.noAthletes': 'No se encontraron atletas.',

        'scoreboard.loading': 'CARGANDO MARCADOR...',
        'scoreboard.endMatch': 'Finalizar Lucha',
        'scoreboard.back': 'Volver',
        'modal.finalize': 'Finalizar Resultado',
        'modal.selectWinner': 'Seleccionar Ganador',
        'modal.method': 'Método de Victoria',
        'modal.cancel': 'Cancelar',
        'modal.confirm': 'Confirmar Resultado',
        'modal.points': 'Puntos',
        'modal.submission': 'Sumisión',
        'modal.decision': 'Decisión del Árbitro',
        'modal.dq': 'Descalificación',
        'modal.walkover': 'Walkover',
        'modal.advantage': 'Ventaja',

        'brackets.title': 'LLAVES',
        'brackets.loading': 'Cargando Llave...',
        'brackets.notFound': 'No se encontró llave',
        'brackets.notFoundDesc': 'No pudimos encontrar una llave para esta categoría. Es posible que aún no se haya generado.',
        'brackets.goBack': 'Volver',
        'brackets.main': 'LLAVE PRINCIPAL',
        'brackets.consolation': 'LLAVE DE CONSOLACIÓN',
        'brackets.round': 'Ronda',

        'leaderboard.title': 'Clasificación',
        'leaderboard.loading': 'Cargando Clasificación...',
        'leaderboard.athlete': 'Atleta',
        'leaderboard.academy': 'Academia',
        'leaderboard.wins': 'Victorias',
        'leaderboard.subs': 'Subs',
        'leaderboard.points': 'Puntos',
        'leaderboard.belt': 'Cinturón',
    }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
    const [language, setLanguage] = useState<Language>('en');

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'es' : 'en');
    };

    const t = (key: string) => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
