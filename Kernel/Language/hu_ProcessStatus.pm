# --
# Kernel/Language/hu_ProcessStatus.pm - the Hungarian translation for ProcessStatus
# Copyright (C) 2011-2016 Perl-Services, http://www.perl-services.de
# Copyright (C) 2016 Balázs Úr, http://www.otrs-megoldasok.hu
# --
# This software comes with ABSOLUTELY NO WARRANTY. For details, see
# the enclosed file COPYING for license information (AGPL). If you
# did not receive this file, see http://www.gnu.org/licenses/agpl.txt.
# --

package Kernel::Language::hu_ProcessStatus;

use strict;
use warnings;
use utf8;

sub Data {
    my $Self = shift;

    my $Lang = $Self->{Translation};

    return if ref $Lang ne 'HASH';

    # Kernel/Config/Files/ProcessStatus.xml
    $Lang->{'Shows a link in the menu to show currenct process status.'} =
        'Egy hivatkozást jelenít meg a menüben az aktuális folyamatállapot megjelenítéséhez.';
    $Lang->{'ProcessStatus'} = 'Folyamatállapot';
    $Lang->{'Show current process status.'} = 'Az aktuális folyamatállapot megjelenítése.';
    $Lang->{'Enable/Disable debugging feature.'} = 'A hibakeresési funkció engedélyezése vagy letiltása.';
    $Lang->{'Background color for the active activity.'} = 'Háttérszín az aktív tevékenységhez.';
    $Lang->{'Frontend module registration for process status module.'} = 'Előtétprogram-modul regisztráció a folyamatállapot modulhoz.';
    $Lang->{'Current Process Status'} = 'Aktuális folyamatállapot';

    # Custom/Kernel/Output/HTML/Templates/Standard/AgentProcessStatus.tt
    $Lang->{'Show current process status for ticket'} = 'A jegy aktuális folyamatállapotának megjelenítése';
    $Lang->{'Cancel & close window'} = 'Mégse és az ablak bezárása';

    # Custom/Kernel/Modules/AgentProcessStatus.pm
    $Lang->{'No Ticket found!'} = 'Nem található jegy!';

    return 1;
}

1;
