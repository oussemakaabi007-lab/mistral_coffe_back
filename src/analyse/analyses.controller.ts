import { Controller, Get, Query } from '@nestjs/common';
import { AnalysesService } from './analyses.service';

@Controller('analyses')
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}
  @Get('rapport-complet')
  async getComprehensiveReport(@Query('periode') periode: 'jour' | 'semaine' | 'mois' = 'jour') {
    return this.analysesService.getComprehensiveReport(periode);
  }
  @Get('stats')
  async getGlobalStats(@Query('periode') periode: 'jour' | 'semaine' | 'mois' = 'jour') {
    return this.analysesService.getGlobalStats(periode);
  }

  @Get('top-produits')
  async getTopProducts(@Query('periode') periode: 'jour' | 'semaine' | 'mois' = 'jour') {
    return this.analysesService.getTopProducts(periode);
  }

  @Get('journal-quotidien')
  async getDailyJournal(@Query('date') dateStr: string) {
    return this.analysesService.getDailyJournal(dateStr);
  }
}